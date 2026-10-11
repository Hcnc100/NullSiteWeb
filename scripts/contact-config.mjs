import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function contactConfigSource(value) {
  if (typeof value !== 'string' || !value.trim()) throw Error('CONTACT_ALLOWED_ORIGINS is required');
  const origins = value.split(',').map(origin => origin.trim());
  if (origins.some(origin => {
    try { const url = new URL(origin); return url.protocol !== 'https:' || url.origin !== origin; }
    catch { return true; }
  })) throw Error('CONTACT_ALLOWED_ORIGINS must contain exact HTTPS origins');
  return `CONTACT_ALLOWED_ORIGINS=${JSON.stringify([...new Set(origins)].join(','))}\n`;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  writeFileSync('functions-contact/.env.nullpointer-716ae', contactConfigSource(process.env.CONTACT_ALLOWED_ORIGINS));
}
