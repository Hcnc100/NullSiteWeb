import { vi } from 'vitest';
import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BlogComponent } from './blog.component';
import { PublicBlogService } from './public-blog.service';
import { SeoService } from './seo.service';
import type { BlogPost } from '../models/blog-post';

describe('Public blog reader', () => {
  const enabled = signal(false);
  let nextPost: (post: BlogPost | null) => void;
  let stop: Mock;
  let image: Mock;
  const post: BlogPost = { id: 'es-post', draftId: 'draft', title: 'Public title', slug: 'post', locale: 'es',
    excerpt: 'Excerpt', tags: ['Angular'], contentHtml: '<h2>Safe</h2><script>alert(1)</script>', status: 'published',
    sourceRevision: 1, assetVersion: 'v1' };
  beforeEach(() => {
    localStorage.setItem('nullsite.locale', 'es'); enabled.set(false);
    stop = vi.fn().mockName('stop'); image = vi.fn().mockName('image').mockResolvedValue(new Blob(['x']));
    const params = convertToParamMap({ slug: 'post' });
    TestBed.configureTestingModule({ imports: [BlogComponent], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: of(params), snapshot: { paramMap: params } } },
      { provide: SeoService, useValue: { setPage: vi.fn().mockName('setPage') } },
      { provide: PublicBlogService, useValue: { enabled, ready: signal(true), error: signal(false), image,
        post: (_locale: string, _slug: string, next: typeof nextPost) => { nextPost = next; return stop; } } },
    ] });
  });
  it('does not expose an article while disabled', () => {
    const fixture = TestBed.createComponent(BlogComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Blog no disponible');
    expect(fixture.componentInstance.post()).toBeNull();
  });
  it('sanitizes public HTML and clears article/metadata when disabled', () => {
    enabled.set(true); const fixture = TestBed.createComponent(BlogComponent); fixture.detectChanges();
    nextPost(post); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h2').textContent).toBe('Safe');
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    enabled.set(false); fixture.detectChanges();
    expect(stop).toHaveBeenCalled(); expect(fixture.componentInstance.post()).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Public title');
    expect(TestBed.inject(SeoService).setPage).toHaveBeenCalledWith(expect.objectContaining({ index: false }));
  });
  it('revokes temporary image URLs when the blog is disabled', async () => {
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    enabled.set(true); const fixture = TestBed.createComponent(BlogComponent); fixture.detectChanges();
    nextPost({ ...post, contentHtml: '<p>Image</p><img src="blog-public/es-post/v1/x.png" alt="Test">' });
    await fixture.whenStable(); fixture.detectChanges(); expect(create).toHaveBeenCalled();
    enabled.set(false); fixture.detectChanges(); expect(revoke).toHaveBeenCalledWith('blob:test');
  });
});
