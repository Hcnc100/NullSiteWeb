import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactPayload, contactHandler, quotaKeys, verifyCaptcha } from '../contact.mjs';

const payload = { name: ' Visitor ', email: 'visitor@example.com', subject: 'Hello', message: 'Message', token: 'token' };
const req = (overrides = {}) => ({ method: 'POST', ip: '192.0.2.1', rawBody: Buffer.from('{}'), body: payload,
  get: () => 'https://example.com', is: () => true, ...overrides });
const response = () => ({ code: 0, body: null, set() {}, status(code) { this.code = code; return this; },
  json(body) { this.body = body; } });
test('payload trims, bounds and rejects server-owned fields', () => {
  assert.equal(contactPayload(payload).name, 'Visitor');
  for (const bad of [null, [], { ...payload, isOpen: true }, { ...payload, name: 'xx' },
    { ...payload, message: 'x'.repeat(251) }, { ...payload, email: 'bad' }, { ...payload, token: '' }]) {
    assert.equal(contactPayload(bad), null);
  }
});
test('rate keys are private, bucketed and require configuration', () => {
  const key = 'x'.repeat(32);
  assert.equal(quotaKeys('192.0.2.1', key, 1).ip, quotaKeys('192.0.2.1', key, 2).ip);
  assert.notEqual(quotaKeys('192.0.2.1', key, 1).ip, quotaKeys('192.0.2.1', key, 600001).ip);
  assert.ok(!quotaKeys('192.0.2.1', key, 1).ip.includes('192.0.2.1'));
  assert.throws(() => quotaKeys('', key, 1));
  assert.throws(() => quotaKeys('ip', 'short', 1));
});
test('CAPTCHA verifies exact hostname and fails closed', async () => {
  const fake = result => async (_url, options) => {
    assert.equal(options.method, 'POST');
    assert.equal(options.body.get('response'), 'token');
    assert.equal(options.body.get('secret'), 'secret');
    return { ok: true, json: async () => result };
  };
  assert.equal(await verifyCaptcha('token', 'secret', 'example.com', fake({ success: true, hostname: 'example.com' })), true);
  assert.equal(await verifyCaptcha('token', 'secret', 'example.com', fake({ success: true, hostname: 'other.com' })), false);
  assert.equal(await verifyCaptcha('token', 'secret', 'example.com', fake({ success: false })), false);
  assert.equal(await verifyCaptcha('token', '', 'example.com', fake({})), false);
  assert.equal(await verifyCaptcha('token', 'secret', 'example.com', async () => { throw Error('network'); }), false);
  assert.equal(await verifyCaptcha('token', 'secret', 'example.com', async () => ({ ok: false })), false);
});
test('handler denies invalid requests before verification or persistence', async () => {
  const handler = contactHandler({ origins: () => ['https://example.com'],
    verify: () => assert.fail('unexpected verification'), persist: () => assert.fail('unexpected persistence') });
  for (const [request, status] of [[req({ method: 'GET' }), 405], [req({ get: () => 'https://evil.com' }), 403],
    [req({ get: () => undefined }), 403], [req({ is: () => false }), 400],
    [req({ rawBody: Buffer.alloc(8193) }), 400], [req({ body: {} }), 400], [req({ ip: '' }), 400]]) {
    const res = response(); await handler(request, res); assert.equal(res.code, status);
  }
});
test('handler rejects CAPTCHA, quota and errors without leaking details', async () => {
  for (const [verify, persist, status] of [[async () => false, () => assert.fail('persistence'), 400],
    [async () => true, async () => false, 429], [async () => true, async () => { throw Error('secret'); }, 503]]) {
    const res = response();
    await contactHandler({ origins: () => ['https://example.com'], verify, persist })(req(), res);
    assert.equal(res.code, status); assert.deepEqual(res.body, { ok: false });
  }
});
test('successful persistence receives no token and cannot be forged as opened', async () => {
  const res = response();
  await contactHandler({ origins: () => ['https://example.com'], verify: async (token, host) => {
    assert.equal(token, 'token'); assert.equal(host, 'example.com'); return true;
  }, persist: async (mail, ip) => {
    assert.equal(mail.name, 'Visitor'); assert.ok(!('token' in mail)); assert.ok(!('isOpen' in mail));
    assert.equal(ip, '192.0.2.1'); return true;
  } })(req(), res);
  assert.equal(res.code, 201); assert.deepEqual(res.body, { ok: true });
});
