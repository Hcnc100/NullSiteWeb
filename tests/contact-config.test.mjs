import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactConfigSource } from '../scripts/contact-config.mjs';
test('contact origins require exact HTTPS origins without wildcards or injection', () => {
  for (const value of [undefined, '', '*', 'http://example.com', 'https://example.com/path',
    'https://example.com/', 'https://example.com\nOTHER=value', 'https://example.com,']) {
    assert.throws(() => contactConfigSource(value));
  }
});
test('contact origins normalize duplicates and serialize as dotenv data', () => {
  assert.equal(contactConfigSource('https://example.com, https://example.com, https://www.example.com'),
    'CONTACT_ALLOWED_ORIGINS="https://example.com,https://www.example.com"\n');
});
