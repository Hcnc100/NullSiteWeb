import { isHttpsUrl } from '../models/profile-editor.model';
import { richTextClasses } from '../models/rich-text-format';

export interface LegalHeading { id: string; text: string; level: number; }
export interface LegalHtmlResult {
  html: string;
  headings: readonly LegalHeading[];
  changed: boolean;
  rejected: 'invalid-content' | 'too-long' | 'too-complex' | null;
}

export const LEGAL_HTML_LIMITS = { characters: 500_000, nodes: 20_000, depth: 80, headings: 200 } as const;
const allowedTags = new Set(['p', 'div', 'span', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'br', 'hr', 'a', 'table', 'thead', 'tbody', 'tfoot', 'tr',
  'th', 'td', 'caption', 'dl', 'dt', 'dd', 'abbr', 'sup', 'sub', 'time']);
const droppedTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template',
  'form', 'input', 'button', 'textarea', 'select', 'video', 'audio', 'img', 'picture', 'source', 'link', 'meta', 'base']);
const allowedClasses = new Set(['legal-note', 'legal-warning', 'legal-lead', 'legal-align-left',
  'legal-align-center', 'legal-align-right', 'legal-strong', 'legal-emphasis', 'legal-underline']);

export function legalHref(value: string): string | null {
  if (value.length > 2048 || /[\u0000-\u0020\u007f]/.test(value)) return null;
  if (isHttpsUrl(value)) return new URL(value).href;
  // A single recipient, without headers, query strings or encoded CR/LF injection.
  if (/^mailto:[a-z0-9.!$&'*+/=^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/i.test(value)) {
    return value;
  }
  return null;
}

/** Rebuild in an inert document; never trust raw HTML, CSS, IDs or Angular template syntax. */
export function sanitizeLegalHtml(
  html: unknown, document: Document, prefix = 'legal',
): LegalHtmlResult {
  const rejected = (reason: LegalHtmlResult['rejected']): LegalHtmlResult =>
    ({ html: '', headings: [], changed: true, rejected: reason });
  if (typeof html !== 'string' || html.trim().length === 0) return rejected('invalid-content');
  if (html.length > LEGAL_HTML_LIMITS.characters) return rejected('too-long');
  if ((html.match(/</g)?.length ?? 0) > LEGAL_HTML_LIMITS.nodes * 2) return rejected('too-complex');

  const template = document.createElement('template');
  template.innerHTML = html;
  const inert = template.content.ownerDocument;
  const output = inert.createElement('div');
  const headings: LegalHeading[] = [];
  const anchorPrefix = /^[a-z][a-z0-9-]{0,40}$/.test(prefix) ? prefix : 'legal';
  let changed = false;
  let nodes = 0;
  let tooComplex = false;

  function copy(source: Node, parent: Node, depth: number): void {
    if (tooComplex) return;
    if (++nodes > LEGAL_HTML_LIMITS.nodes || depth > LEGAL_HTML_LIMITS.depth) { tooComplex = true; return; }
    if (source.nodeType === 3) { parent.appendChild(inert.createTextNode(source.textContent ?? '')); return; }
    if (source.nodeType !== 1) { changed = true; return; }
    const element = source as HTMLElement;
    const originalTag = element.localName.toLowerCase();
    if (element.namespaceURI !== 'http://www.w3.org/1999/xhtml' || droppedTags.has(originalTag)) {
      changed = true; return;
    }
    const tag = originalTag === 'font' ? 'span' : originalTag === 'h1' ? 'h2'
      : ['article', 'section', 'header', 'footer', 'main', 'center'].includes(originalTag) ? 'div' : originalTag;
    if (tag !== originalTag) changed = true;
    if (!allowedTags.has(tag)) {
      changed = true;
      for (const child of Array.from(source.childNodes)) copy(child, parent, depth + 1);
      return;
    }
    const clean = inert.createElement(tag);
    const accepted = new Set<string>();
    const classes = [...(element.getAttribute('class') ?? '').split(/\s+/).filter(value => allowedClasses.has(value)), ...richTextClasses(element)];
    if (element.hasAttribute('class')) {
      if (classes.join(' ') === element.getAttribute('class')) accepted.add('class');
    }
    // Only these visual properties are mapped to theme classes. No supplied CSS survives.
    const inlineAlignment = element.style.textAlign;
    const alignment = inlineAlignment.length > 0 ? inlineAlignment : element.getAttribute('align') ?? '';
    if (['left', 'center', 'right'].includes(alignment)) classes.push(`legal-align-${alignment}`);
    if (['bold', '700'].includes(element.style.fontWeight)) classes.push('legal-strong');
    if (element.style.fontStyle === 'italic') classes.push('legal-emphasis');
    if (originalTag === 'center') classes.push('legal-align-center');
    if (classes.length > 0) clean.setAttribute('class', [...new Set(classes)].join(' '));
    const lang = element.getAttribute('lang') ?? '';
    if (/^(?:es|en)(?:-[a-z]{2})?$/i.test(lang)) {
      clean.setAttribute('lang', lang.toLowerCase()); accepted.add('lang');
    }
    if (tag === 'a') {
      const href = legalHref(element.getAttribute('href') ?? '');
      if (href !== null) {
        clean.setAttribute('href', href); accepted.add('href');
        clean.setAttribute('rel', 'noopener noreferrer');
        if (element.getAttribute('target') === '_blank') { clean.setAttribute('target', '_blank'); accepted.add('target'); }
        if (element.getAttribute('rel') === 'noopener noreferrer') accepted.add('rel');
      } else changed = true;
    }
    if (['th', 'td'].includes(tag)) {
      for (const name of ['colspan', 'rowspan']) {
        const value = element.getAttribute(name) ?? '';
        if (/^[1-9]\d?$/.test(value)) { clean.setAttribute(name, value); accepted.add(name); }
      }
      const scope = element.getAttribute('scope') ?? '';
      if (tag === 'th' && ['row', 'col', 'rowgroup', 'colgroup'].includes(scope)) {
        clean.setAttribute('scope', scope); accepted.add('scope');
      }
    }
    if (tag === 'ol' && /^\d{1,6}$/.test(element.getAttribute('start') ?? '')) {
      clean.setAttribute('start', element.getAttribute('start')!); accepted.add('start');
    }
    if (tag === 'time' && /^[\dT:Z+.\- ]{4,64}$/.test(element.getAttribute('datetime') ?? '')) {
      clean.setAttribute('datetime', element.getAttribute('datetime')!); accepted.add('datetime');
    }
    if (Array.from(element.attributes).some(attribute => !accepted.has(attribute.name))) changed = true;
    for (const child of Array.from(source.childNodes)) copy(child, clean, depth + 1);
    parent.appendChild(clean);
  }
  for (const child of Array.from(template.content.childNodes)) copy(child, output, 0);
  if (tooComplex) return rejected('too-complex');
  if ((output.textContent?.trim().length ?? 0) === 0) return rejected('invalid-content');
  let previousLevel = 1;
  for (const element of Array.from(output.querySelectorAll('h2,h3,h4,h5,h6'))) {
    const text = element.textContent?.trim() ?? '';
    if (text.length === 0) continue;
    if (headings.length >= LEGAL_HTML_LIMITS.headings) return rejected('too-complex');
    const originalLevel = Number(element.localName[1]);
    const level = Math.min(originalLevel, previousLevel + 1);
    if (level !== originalLevel) {
      const heading = inert.createElement(`h${level}`);
      for (const attribute of Array.from(element.attributes)) heading.setAttribute(attribute.name, attribute.value);
      while (element.firstChild !== null) heading.appendChild(element.firstChild);
      element.replaceWith(heading); changed = true;
    }
    previousLevel = level;
    const label = text.length > 200 ? `${text.slice(0, 197)}…` : text;
    headings.push({ id: `${anchorPrefix}-section-${headings.length + 1}`, text: label, level });
  }
  const result = output.innerHTML;
  if (result.length > LEGAL_HTML_LIMITS.characters) return rejected('too-long');
  return { html: result, headings, changed: changed || result !== html, rejected: null };
}
