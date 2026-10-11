import { vi } from 'vitest';
import type { Mock, MockInstance } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { BlogThumbnailComponent } from './blog-thumbnail.component';
import { PublicBlogService } from './public-blog.service';
import type { BlogPost } from '../models/blog-post';

describe('Public blog thumbnail boundary', () => {
  const enabled = signal(true);
  const post: BlogPost = { id: 'es-post', draftId: 'draft', title: 'Post', slug: 'post', locale: 'es', excerpt: 'Summary', tags: [],
    contentHtml: '<img src="blog-public/es-post/v1/image.png" alt="Home screen">', status: 'published', assetVersion: 'v1', sourceRevision: 1 };
  let image: Mock;
  let fixture: ComponentFixture<BlogThumbnailComponent>;
  let intersect: IntersectionObserverCallback;
  let observer: IntersectionObserver;
  let create: MockInstance<typeof URL.createObjectURL>;
  let revoke: MockInstance<typeof URL.revokeObjectURL>;
  beforeEach(() => {
    enabled.set(true); image = vi.fn().mockName('image').mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test'); revoke = vi.spyOn(URL, 'revokeObjectURL');
    observer = { observe: vi.fn().mockName('observe'), disconnect: vi.fn().mockName('disconnect') } as unknown as IntersectionObserver;
    vi.spyOn(window, 'IntersectionObserver').mockImplementation(function(callback: IntersectionObserverCallback) {
      intersect = callback; return observer;
    });
    TestBed.configureTestingModule({ imports: [BlogThumbnailComponent], providers: [
      { provide: PublicBlogService, useValue: { enabled, image } },
    ] }); fixture = TestBed.createComponent(BlogThumbnailComponent); fixture.componentRef.setInput('post', post); fixture.detectChanges();
  });
  async function visible(): Promise<void> {
    intersect([{ isIntersecting: true } as IntersectionObserverEntry], observer); await fixture.whenStable(); fixture.detectChanges();
  }
  it('does not fetch until near the viewport, then loads only once with descriptive alt', async () => {
    expect(image).not.toHaveBeenCalled(); await visible(); await visible();
    expect(image.mock.calls.length).toBe(1); expect(image).toHaveBeenCalledWith('blog-public/es-post/v1/image.png', 'es-post', 'v1');
    expect(fixture.nativeElement.querySelector('img').alt).toBe('Home screen');
  });
  it('revokes the URL and clears the thumbnail when the blog is disabled', async () => {
    await visible(); enabled.set(false); fixture.detectChanges();
    expect(revoke).toHaveBeenCalledWith('blob:test'); expect(fixture.componentInstance.url()).toBe('');
  });
  it('ignores a late image after revocation without creating an object URL', async () => {
    let resolve!: (blob: Blob) => void; image.mockReturnValue(new Promise(done => { resolve = done; }));
    intersect([{ isIntersecting: true } as IntersectionObserverEntry], observer);
    enabled.set(false); fixture.detectChanges(); resolve(new Blob(['png'], { type: 'image/png' }));
    await fixture.whenStable(); expect(create).not.toHaveBeenCalled();
  });
  it('never resolves private paths, foreign hosts or stale publication versions', () => {
    for (const src of ['blog-drafts/draft/image.png', 'https://example.com/tracking.png', 'blog-public/es-post/old/image.png']) {
      fixture.componentRef.setInput('post', { ...post, contentHtml: `<img src="${src}" alt="Test">` }); fixture.detectChanges();
      expect(fixture.componentInstance.present()).toBe(false);
    }
    expect(image).not.toHaveBeenCalled();
  });
  it('rejects executable SVG and gracefully hides failed media', async () => {
    image.mockResolvedValue(new Blob(['<svg/>'], { type: 'image/svg+xml' })); await visible();
    expect(create).not.toHaveBeenCalled(); expect(fixture.componentInstance.present()).toBe(false);
  });
  it('disconnects and releases blob URLs on component teardown', async () => {
    await visible(); fixture.destroy(); expect(observer.disconnect).toHaveBeenCalled(); expect(revoke).toHaveBeenCalledWith('blob:test');
  });
});
