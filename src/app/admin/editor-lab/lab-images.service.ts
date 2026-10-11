import { inject, Injectable, Injector, OnDestroy } from '@angular/core';
import { Image } from '@tiptap/extension-image';
import { AdminBlogService } from '../blog/admin-blog.service';
import { AdminAuthService } from '../auth/admin-auth.service';
import { privateImagePath } from '../../models/blog-draft';
import { validImage } from '../../models/managed-content';

export const labImagePath = (path: string): boolean => privateImagePath(path, 'editor-lab');

/** Only explicit uploads use Firebase, and only the existing administrator session. */
@Injectable()
export class LabImagesService implements OnDestroy {
  private readonly injector = inject(Injector);
  private readonly urls = new Map<string, string>();
  private readonly pending = new Map<string, Promise<string>>();
  private readonly staged = new Map<string, File>();
  private readonly promoted = new Map<string, string>();
  private destroyed = false;
  public async stage(file: File): Promise<string> {
    await this.validate(file);
    const path = `blog-drafts/editor-lab/pending-${crypto.randomUUID()}.${file.type.split('/')[1]}`;
    if (this.destroyed) throw Error('Editor cerrado');
    this.staged.set(path, file); this.urls.set(path, URL.createObjectURL(file));
    return path;
  }
  private async validate(file: File): Promise<void> {
    if (!validImage(file)) throw Error('Usa PNG, JPEG, WebP o GIF de hasta 10 MB.');
    const decoded = await createImageBitmap(file);
    const pixels = decoded.width * decoded.height; decoded.close();
    if (pixels > 40_000_000) throw Error('Imagen demasiado grande: máximo 40 megapíxeles.');
  }
  public hasPending(html: string): boolean { return /blog-drafts\/editor-lab\/pending-/.test(html); }
  public async persistHtml(html: string): Promise<string> {
    const template = document.createElement('template'); template.innerHTML = html;
    for (const image of Array.from(template.content.querySelectorAll('img'))) {
      const attr = image.hasAttribute('data-image-path') ? 'data-image-path' : 'src';
      const path = image.getAttribute(attr) ?? '';
      if (!path.startsWith('blog-drafts/editor-lab/pending-')) continue;
      let destination = this.promoted.get(path);
      if (!destination) {
        const file = this.staged.get(path);
        if (!file) throw Error('La imagen temporal ya no está en memoria. Vuelve a pegarla antes de guardar.');
        destination = await this.upload(file); this.promoted.set(path, destination);
      }
      image.setAttribute(attr, destination);
    }
    return template.innerHTML;
  }
  public async upload(file: File): Promise<string> {
    await this.validate(file);
    const auth = this.injector.get(AdminAuthService);
    if (await auth.whenReady() !== 'admin') throw Error('Inicia sesión como administrador en /admin/login.');
    return this.injector.get(AdminBlogService).upload('editor-lab', file, () => undefined);
  }
  public async fromUrl(value: string): Promise<File> {
    const url = new URL(value);
    // Browser-only fetch, no credentials/redirects; reject literal IPs and obvious local hostnames.
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')
      || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) || /(?:^|\.)(localhost|local|internal|test|invalid)$/i.test(url.hostname)) throw Error('Usa una URL HTTPS pública, sin credenciales.');
    const auth = this.injector.get(AdminAuthService);
    if (await auth.whenReady() !== 'admin') throw Error('Inicia sesión como administrador en /admin/login.');
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url.href, { credentials: 'omit', redirect: 'error', signal: controller.signal });
      const type = (response.headers.get('content-type') ?? '').split(';')[0];
      if (!response.ok || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(type) || !response.body) throw Error('La URL no devuelve una imagen admitida.');
      const reader = response.body.getReader(); const chunks: Uint8Array<ArrayBuffer>[] = []; let size = 0;
      while (true) {
        const { value: chunk, done } = await reader.read(); if (done) break;
        size += chunk.byteLength;
        if (size > 10 * 1024 * 1024) { await reader.cancel(); throw Error('Máximo 10 MB.'); }
        chunks.push(new Uint8Array(chunk));
      }
      return new File(chunks, 'imagen-enlace.' + type.split('/')[1], { type });
    } catch (error) {
      throw Error(error instanceof Error ? 'No se pudo importar: ' + error.message + '. Si el sitio bloquea CORS, descarga la imagen y súbela como archivo.' : 'No se pudo importar la imagen.');
    } finally { clearTimeout(timeout); }
  }
  public image(path: string): Promise<string> {
    if (!labImagePath(path)) return Promise.reject(Error('Ruta no permitida'));
    const cached = this.urls.get(path); if (cached) return Promise.resolve(cached);
    const pending = this.pending.get(path); if (pending) return pending;
    const request = this.load(path); this.pending.set(path, request);
    void request.finally(() => this.pending.delete(path)).catch(() => undefined);
    return request;
  }
  private async load(path: string): Promise<string> {
    const auth = this.injector.get(AdminAuthService);
    if (await auth.whenReady() !== 'admin') throw Error('unauthorized');
    const blob = await this.injector.get(AdminBlogService).image(path, 'editor-lab');
    if (this.destroyed || !auth.isAdmin()) throw Error('unauthorized');
    const url = URL.createObjectURL(blob); this.urls.set(path, url); return url;
  }
  public extension() {
    const service = this;
    return Image.extend({
      addAttributes() { return { ...this.parent?.(), imageAlign: {
        default: 'left', parseHTML: element => ['left', 'center', 'right'].find(align => element.classList.contains('rt-image-' + align)) ?? 'left',
        renderHTML: attrs => ({ class: 'rt-image-' + (['left', 'center', 'right'].includes(attrs['imageAlign']) ? attrs['imageAlign'] : 'left') }),
      } }; },
      parseHTML() { return [{ tag: 'img[data-image-path]', getAttrs: el => ({ src: (el as HTMLElement).getAttribute('data-image-path'), alt: (el as HTMLElement).getAttribute('alt') }) }, ...(this.parent?.() ?? [])]; },
      addNodeView() { return ({ node }) => {
        const img = document.createElement('img'); img.alt = String(node.attrs['alt'] ?? '');
        img.className = 'rt-image-' + (['left', 'center', 'right'].includes(node.attrs['imageAlign']) ? node.attrs['imageAlign'] : 'left');
        let disposed = false;
        void service.image(String(node.attrs['src'] ?? '')).then(url => { if (!disposed) img.src = url; }).catch(() => { img.title = 'Imagen privada no disponible. Inicia sesión.'; });
        return { dom: img, destroy: () => { disposed = true; } };
      }; },
    });
  }
  public ngOnDestroy(): void { this.destroyed = true; this.urls.forEach(url => URL.revokeObjectURL(url)); this.urls.clear(); this.staged.clear(); this.promoted.clear(); }
}
