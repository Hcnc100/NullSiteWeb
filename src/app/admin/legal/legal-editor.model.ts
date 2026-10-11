import type { Terms } from '../../models/Terms';
import { sanitizeLegalHtml } from '../../terms/legal-html';

export interface LegalDraft extends Terms {
  id: string;
  revision: number;
  publishedRevision: number;
  base: Terms | null;
}
export interface LegalRecord { id: string; published: Terms | null; draft: LegalDraft | null; }
export interface LegalHistory { id: string; title: string; content: string; previous: Terms | null; revision: number; }

export function legalId(id: string): boolean { return /^[a-zA-Z0-9_-]{1,100}$/.test(id); }
export function assertLegalSize(value: unknown): void {
  // Two copies (new + previous public HTML) can exceed Firestore's 1 MiB document limit.
  if (new TextEncoder().encode(JSON.stringify(value)).length > 900_000) throw new Error('legal-size');
}
export function termsValue(data: unknown): Terms | null {
  if (typeof data !== 'object' || data === null) return null;
  const item = data as Partial<Terms>;
  return typeof item.title === 'string' && typeof item.content === 'string'
    ? { title: item.title, content: item.content } : null;
}
export function sameTerms(a: Terms | null, b: Terms | null): boolean {
  return a === null || b === null ? a === b : a.title === b.title && a.content === b.content;
}
export function draftValue(id: string, data: unknown): LegalDraft {
  const terms = termsValue(data);
  const value = data as Partial<LegalDraft> | null;
  if (terms === null || value === null || !legalId(id) || !Number.isSafeInteger(value.revision)
    || (value.revision ?? 0) < 1 || !Number.isSafeInteger(value.publishedRevision)
    || (value.publishedRevision ?? -1) < 0 || (value.publishedRevision ?? 0) > (value.revision ?? 0)
    || (value.base !== null && termsValue(value.base) === null)) throw new Error('legal-invalid');
  return { id, ...terms, revision: value.revision!, publishedRevision: value.publishedRevision!,
    base: value.base === null ? null : termsValue(value.base) };
}
export function sameDraft(a: LegalDraft | null, b: LegalDraft | null): boolean {
  return a === null || b === null ? a === b : a.id === b.id && a.revision === b.revision
    && a.publishedRevision === b.publishedRevision && sameTerms(a, b) && sameTerms(a.base, b.base);
}
export function legalContent(value: Terms, document: Document): Terms {
  if (typeof value.title !== 'string' || value.title.trim().length === 0 || value.title.length > 180
    || /[\u0000-\u001f\u007f]/.test(value.title)) throw new Error('legal-invalid');
  const result = sanitizeLegalHtml(value.content, document);
  if (result.rejected !== null) throw new Error('legal-invalid');
  return { title: value.title.trim(), content: result.html };
}
