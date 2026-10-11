/** Browser-only import. Public HTTPS, no credentials/redirects; CORS is not bypassed. */
export async function importImageFile(value: string): Promise<File> {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)
    || /(?:^|\.)(localhost|local|internal|test|invalid)$/i.test(url.hostname)) throw Error('Usa un enlace HTTPS público.');
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url.href, { credentials: 'omit', redirect: 'error', signal: controller.signal });
    const type = (response.headers.get('content-type') ?? '').split(';')[0];
    if (!response.ok || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(type) || !response.body) throw Error('Formato no permitido.');
    const reader = response.body.getReader(); const chunks: Uint8Array<ArrayBuffer>[] = []; let size = 0;
    while (true) {
      const { done, value: bytes } = await reader.read(); if (done) break;
      size += bytes.length; if (size > 10 * 1024 * 1024) { await reader.cancel(); throw Error('Máximo 10 MB.'); }
      chunks.push(new Uint8Array(bytes));
    }
    return new File(chunks, 'imagen.' + type.split('/')[1], { type });
  } finally { clearTimeout(timeout); }
}
