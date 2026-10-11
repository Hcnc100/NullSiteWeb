import type { Locale } from '../i18n/translations';
import type { BlogDraft } from './blog-draft';
import { sanitizePublishedHtml, validateDraft } from './blog-draft';

// A public snapshot; saving the private draft never changes this document.
export interface BlogPost {
  id: string; draftId: string; title: string; slug: string; excerpt: string; locale: Locale; tags: string[];
  contentHtml: string; status: 'published'; assetVersion: string; sourceRevision: number;
  publishedAt?: unknown;
}

export function postKey(locale: Locale, slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) throw new Error('blog-invalid');
  return `${locale}-${slug}`;
}

export function publicSnapshot(draft: BlogDraft, contentHtml: string, assetVersion: string, document: Document): Omit<BlogPost, 'id' | 'publishedAt'> {
  validateDraft(draft);
  const key = postKey(draft.locale, draft.slug);
  return { draftId: draft.id, title: draft.title.trim(), slug: draft.slug, excerpt: draft.excerpt.trim(),
    locale: draft.locale, tags: [...draft.tags], contentHtml: sanitizePublishedHtml(contentHtml, key, assetVersion, document),
    status: 'published', assetVersion, sourceRevision: draft.revision };
}
