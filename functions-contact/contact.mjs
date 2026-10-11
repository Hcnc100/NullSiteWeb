import { createHmac } from 'node:crypto';

export function contactPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const limits = { name: [3, 50], email: [5, 50], subject: [1, 100], message: [1, 250], token: [1, 4096] };
  if (Object.keys(body).some(key => !Object.hasOwn(limits, key))) return null;
  const clean = {};
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (typeof body[key] !== 'string') return null;
    clean[key] = body[key].trim();
    if (clean[key].length < min || clean[key].length > max) return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) return null;
  return clean;
}

export function quotaKeys(ip, secret, now) {
  if (!ip || !secret || secret.length < 32) throw new Error('Missing rate limit configuration');
  const bucket = Math.floor(now / 600000);
  const hash = createHmac('sha256', secret).update(`${bucket}:${ip}`).digest('hex');
  return { ip: `ip-${bucket}-${hash}`, global: `global-${Math.floor(now / 60000)}` };
}

export async function verifyCaptcha(token, secret, hostname, fetcher = fetch) {
  if (!secret) return false;
  try {
    const response = await fetcher('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST', body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5000), redirect: 'error',
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true && result.hostname === hostname;
  } catch { return false; }
}

export function contactHandler({ origins, verify, persist }) {
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'POST') { res.set('Allow', 'POST'); res.status(405).json({ ok: false }); return; }
    const origin = req.get('origin');
    const allowed = origins();
    if (!origin || !allowed.includes(origin)) { res.status(403).json({ ok: false }); return; }
    if (!req.is('application/json') || !req.rawBody || req.rawBody.length > 8192) {
      res.status(400).json({ ok: false }); return;
    }
    const data = contactPayload(req.body);
    if (!data || !req.ip) { res.status(400).json({ ok: false }); return; }
    try {
      if (!await verify(data.token, new URL(origin).hostname)) { res.status(400).json({ ok: false }); return; }
      const { token, ...mail } = data;
      // Persist also enforces quota atomically. Never store/log the CAPTCHA token.
      if (!await persist(mail, req.ip)) { res.status(429).json({ ok: false }); return; }
      res.status(201).json({ ok: true });
    } catch { res.status(503).json({ ok: false }); }
  };
}
