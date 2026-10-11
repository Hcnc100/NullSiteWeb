import type { Locale } from '../i18n/translations';
import { isHttpsUrl } from './profile-editor.model';
import { canonical } from './managed-content';
import { richTextClasses } from './rich-text-format';

export interface BlogDraft {
  id: string; title: string; slug: string; excerpt: string; locale: Locale; tags: string[];
  contentHtml: string; contentFormat: 'html'; contentVersion: 1; status: 'draft';
  revision: number; authorUid: string; createdAt?: unknown; updatedAt?: unknown;
  publicationKey?: string; publishedRevision?: number;
}

export function privateImagePath(path: string, id: string): boolean {
  return /^[\w-]+$/.test(id) && new RegExp(`^blog-drafts/${id}/[\\w-]+\\.(png|jpeg|webp|gif)$`).test(path);
}

// Parse in an inert template, rebuild only a small, explicit HTML vocabulary.
// Raw HTML is never compiled as an Angular template or trusted via bypassSecurityTrustHtml.
export function sanitizeBlogHtml(html: string, id: string, document: Document): { html: string; changed: boolean } {
  return sanitizeHtml(html, document, path => privateImagePath(path, id));
}

export function sanitizePublishedHtml(html: string, key: string, version: string, document: Document): string {
  return sanitizeHtml(html, document, path => publicImagePath(path, key, version)).html;
}

export function publicImagePath(path: string, key: string, version: string): boolean {
  return /^(es|en)-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) && /^[\w-]+$/.test(version)
    && new RegExp(`^blog-public/${key}/${version}/[\\w-]+\\.(png|jpeg|webp|gif)$`).test(path);
}

function sanitizeHtml(html: string, document: Document, acceptsImage: (path: string) => boolean): { html: string; changed: boolean } {
  if (html.length > 200000) return { html: '', changed: true };
  if ((html.match(/</g)?.length ?? 0) > 40000) return { html: '', changed: true };
  const template = document.createElement('template');
  template.innerHTML = html;
  // Detached elements from the active document can still fetch img.src. Keep reconstruction inert too.
  const inert = template.content.ownerDocument;
  const output = inert.createElement('div');
  const allowed = new Set(['p', 'span', 'h2', 'h3', 'h4', 'h5', 'h6', 'u', 's', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li',
    'blockquote', 'pre', 'code', 'br', 'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption']);
  const drop = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template',
    'form', 'input', 'button', 'textarea', 'select', 'video', 'audio', 'link', 'meta', 'base']);
  let changed = false;
  let nodes = 0; let rejected = false;
  function copy(source: Node, parent: Node, depth = 0): void {
    if (rejected) return;
    if (++nodes > 20000 || depth > 80) { rejected = true; return; }
    if (source.nodeType === 3) { parent.appendChild(inert.createTextNode(source.textContent ?? '')); return; }
    if (source.nodeType !== 1) { changed = true; return; }
    const element = source as HTMLElement;
    const originalTag = element.localName.toLowerCase();
    const tag = originalTag === 'div' ? 'p' : originalTag === 'font' ? 'span' : originalTag;
    if (tag !== originalTag) changed = true;
    if (element.namespaceURI !== 'http://www.w3.org/1999/xhtml' || drop.has(tag)) { changed = true; return; }
    if (!allowed.has(tag)) {
      changed = true;
      for (const child of Array.from(source.childNodes)) copy(child, parent, depth + 1);
      return;
    }
    const clean = inert.createElement(tag);
    const accepted = new Set<string>();
    const classes = richTextClasses(element);
    if (['left', 'center', 'right'].includes(element.style.textAlign)) classes.push('rt-align-' + element.style.textAlign);
    classes.sort();
    if (classes.length) clean.setAttribute('class', classes.join(' '));
    if (element.getAttribute('class') === classes.join(' ')) accepted.add('class');
    if (tag === 'a') {
      const href = element.getAttribute('href') ?? '';
      if (isHttpsUrl(href) && href.length <= 2048) { clean.setAttribute('href', href); accepted.add('href'); }
      else changed = true;
      clean.setAttribute('rel', 'noopener noreferrer');
      if (element.getAttribute('rel') === 'noopener noreferrer') accepted.add('rel');
    }
    if (tag === 'td' || tag === 'th') {
      for (const name of ['colspan', 'rowspan']) {
        const value = element.getAttribute(name) ?? '';
        if (/^[1-9]\d?$/.test(value)) { clean.setAttribute(name, value); accepted.add(name); }
      }
    }
    if (tag === 'img') {
      const src = element.getAttribute('src') ?? '';
      if (!acceptsImage(src)) { changed = true; return; }
      clean.setAttribute('src', src); accepted.add('src');
      clean.setAttribute('alt', (element.getAttribute('alt') ?? '').slice(0, 300)); accepted.add('alt');
    }
    if (Array.from(element.attributes).some(attribute => !accepted.has(attribute.name))) changed = true;
    for (const child of Array.from(source.childNodes)) copy(child, clean, depth + 1);
    parent.appendChild(clean);
  }
  for (const child of Array.from(template.content.childNodes)) copy(child, output);
  return { html: rejected ? '' : output.innerHTML, changed: changed || rejected };
}

export function blogFingerprint(draft: BlogDraft): string {
  return canonical([draft.title, draft.slug, draft.excerpt, draft.locale, draft.tags, draft.contentHtml, draft.revision,
    draft.publicationKey ?? null, draft.publishedRevision ?? null]);
}

export function validateDraft(draft: BlogDraft): void {
  if (!/^[\w-]{1,128}$/.test(draft.id) || draft.title.trim().length === 0 || draft.title.length > 180
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug) || draft.slug.length > 100
    || draft.excerpt.length > 500 || draft.contentHtml.length > 200000 || draft.contentHtml.trim().length === 0
    || (draft.locale !== 'es' && draft.locale !== 'en') || draft.tags.length > 20
    || draft.tags.some(tag => tag.trim().length === 0 || tag.length > 40)
    || new Set(draft.tags).size !== draft.tags.length || draft.status !== 'draft'
    || !Number.isSafeInteger(draft.revision) || draft.revision < 0
    || draft.contentFormat !== 'html' || draft.contentVersion !== 1) throw new Error('blog-invalid');
}
