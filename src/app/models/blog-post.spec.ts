
import { sanitizeBlogHtml, sanitizePublishedHtml, publicImagePath } from './blog-draft';
import { postKey, publicSnapshot } from './blog-post';

describe('Public snapshot HTML contract', () => {
  it('publishes an explicit whitelist, never private author fields or draft extras', () => {
    const draft = { id: 'article', title: ' Title ', slug: 'post', locale: 'es' as const, excerpt: '', tags: ['Angular'],
      contentHtml: '<p>Body</p>', contentFormat: 'html' as const, contentVersion: 1 as const, status: 'draft' as const,
      revision: 1, authorUid: 'private-account', privateNotes: 'secret' };
    const snapshot = publicSnapshot(draft, '<p>Body</p>', 'v1', document);
    expect(snapshot.title).toBe('Title'); expect(snapshot.status).toBe('published');
    expect(Object.keys(snapshot)).not.toContain('authorUid');
    expect(Object.keys(snapshot)).not.toContain('privateNotes');
    expect(snapshot.tags).not.toBe(draft.tags);
  });
  it('separates publication assets from private draft assets', () => {
    const html = '<h2>Title</h2><img src="blog-public/es-post/v1/image.png" alt="Photo">';
    expect(sanitizePublishedHtml(html, 'es-post', 'v1', document)).toBe(html);
    expect(sanitizeBlogHtml(html, 'article', document).html).toBe('<h2>Title</h2>');
    expect(sanitizePublishedHtml('<img src="blog-drafts/article/image.png">', 'es-post', 'v1', document)).toBe('');
  });
  it('rejects stale versions, foreign paths and traversal', () => {
    expect(publicImagePath('blog-public/es-post/v1/image.png', 'es-post', 'v2')).toBe(false);
    expect(publicImagePath('blog-public/es-other/v1/image.png', 'es-post', 'v1')).toBe(false);
    expect(publicImagePath('blog-public/es-post/v1/../image.png', 'es-post', 'v1')).toBe(false);
    expect(() => postKey('es', '../private')).toThrowError(new Error("blog-invalid"));
  });
  it('sanitizes hostile published HTML again at the reader boundary', () => {
    const html = '<h2 onclick="evil()">Title</h2><script>evil()</script><img src="https://example.com/track.gif">';
    expect(sanitizePublishedHtml(html, 'es-post', 'v1', document)).toBe('<h2>Title</h2>');
  });
});
