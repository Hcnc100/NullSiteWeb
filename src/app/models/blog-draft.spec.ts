
import { sanitizeBlogHtml, validateDraft, blogFingerprint, privateImagePath } from './blog-draft';
import type { BlogDraft } from './blog-draft';

describe('Private blog HTML contract', () => {
  const clean = (html: string): string => sanitizeBlogHtml(html, 'article', document).html;
  const draft: BlogDraft = { id: 'article', title: 'Title', slug: 'my-article', locale: 'es', tags: ['Angular'],
    excerpt: 'Excerpt', contentHtml: '<p>Body</p>', contentFormat: 'html', contentVersion: 1,
    status: 'draft', revision: 0, authorUid: 'admin' };
  it('preserves supported headings, lists, quotes and escaped code across repeated sanitization', () => {
    const html = '<h2>Title</h2><h3>Sub</h3><p><strong>Bold</strong> <em>Emphasis</em></p>'
      + '<ul><li>One</li></ul><ol><li>Two</li></ol><blockquote>Quote</blockquote>'
      + '<pre><code>&lt;script&gt;example&lt;/script&gt;</code></pre>';
    expect(clean(html)).toBe(html); expect(clean(clean(html))).toBe(html);
  });
  it('removes executable subtrees, events, style and embeds without running them', () => {
    const html = '<script>window.evil=1</script><style>body{display:none}</style><iframe src="https://evil.test"></iframe>'
      + '<svg onload="alert(1)"><a href="javascript:alert(1)">SVG</a></svg>'
      + '<p onclick="alert(1)" style="color:red" id="clobber">Safe</p>';
    const result = sanitizeBlogHtml(html, 'article', document);
    expect(result.html).toBe('<p>Safe</p>'); expect(result.changed).toBe(true);
  });
  it('rejects javascript, data, credentials and encoded dangerous link protocols', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,evil', 'https://user:pass@example.com',
      'jav&#x61;script:alert(1)', 'http://example.com', '//example.com']) {
      expect(clean(`<a href="${href}" onmouseover="alert(1)">Link</a>`)).toBe('<a rel="noopener noreferrer">Link</a>');
    }
  });
  it('retains safe HTTPS links with explicit rel protections', () => {
    expect(clean('<a href="https://example.com/page">Link</a>'))
      .toBe('<a href="https://example.com/page" rel="noopener noreferrer">Link</a>');
  });
  it('admits only images in this draft namespace, never public/token/external/blob paths', () => {
    expect(clean('<img src="blog-drafts/article/id.png" alt="Description" onerror="alert(1)">'))
      .toBe('<img src="blog-drafts/article/id.png" alt="Description">');
    for (const src of ['https://example.com/tracker.png', 'blog-drafts/other/id.png',
      'blog-drafts/article/../other/id.png', 'blob:https://example.com/id', 'data:image/svg+xml,test']) {
      expect(clean(`<img src="${src}">`)).toBe('');
    }
  });
  it('rejects private path traversal and unsupported image formats', () => {
    expect(privateImagePath('blog-drafts/article/a.webp', 'article')).toBe(true);
    expect(privateImagePath('blog-drafts/article/a.svg', 'article')).toBe(false);
    expect(privateImagePath('blog-drafts/article/a.png?token=secret', 'article')).toBe(false);
    expect(privateImagePath('blog-drafts/article/a.png', '../article')).toBe(false);
  });
  it('normalizes native visual editor paragraphs', () => {
    expect(clean('<div>First</div><div>Second<br>Line</div>')).toBe('<p>First</p><p>Second<br>Line</p>');
  });
  it('keeps tags and HTML separate and validates language, slug and size', () => {
    expect(() => validateDraft(draft)).not.toThrow();
    for (const update of [{ slug: 'Bad Slug' }, { tags: ['same', 'same'] }, { tags: Array(21).fill('tag') },
      { locale: 'fr' }, { contentHtml: 'x'.repeat(200001) }, { status: 'published' }, { revision: -1 }, { title: ' ' }]) {
      expect(() => validateDraft({ ...draft, ...update } as BlogDraft)).toThrowError(new Error("blog-invalid"));
    }
  });
  it('detects content and revision conflicts while ignoring server timestamps', () => {
    expect(blogFingerprint(draft)).toBe(blogFingerprint({ ...draft, updatedAt: 42 }));
    expect(blogFingerprint(draft)).not.toBe(blogFingerprint({ ...draft, revision: 1 }));
    expect(blogFingerprint(draft)).not.toBe(blogFingerprint({ ...draft, contentHtml: '<p>Changed</p>' }));
  });
});
