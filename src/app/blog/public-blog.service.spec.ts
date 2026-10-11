import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import { mockMethods } from 'src/testing/mock-methods';
import { TestBed } from '@angular/core/testing';
import { PUBLIC_BLOG_API, PublicBlogService } from './public-blog.service';
import type { PublicBlogApi } from './public-blog.service';

describe('Public blog boundary', () => {
  let enable: (enabled: boolean, authoritative?: boolean) => void;
  let settingsError: () => void;
  let api: Mocked<PublicBlogApi>;
  beforeEach(() => {
    api = mockMethods('blogApi', ['settings', 'list', 'post', 'image']);
    api.settings.mockImplementation((next, error) => { enable = next; settingsError = error; return () => undefined; });
    api.image.mockResolvedValue(new Blob(['image'], { type: 'image/png' }));
    TestBed.configureTestingModule({ providers: [{ provide: PUBLIC_BLOG_API, useValue: api }] });
  });
  it('defaults closed and never queries private drafts or posts while disabled', () => {
    const service = TestBed.inject(PublicBlogService);
    expect(service.enabled()).toBe(false); expect(service.ready()).toBe(false);
    const next = vi.fn().mockName('next'); service.list('es', next, () => undefined);
    expect(api.list).not.toHaveBeenCalled(); expect(next).toHaveBeenCalledWith([]);
  });
  it('accepts a public query only after activation and closes on settings errors', () => {
    const service = TestBed.inject(PublicBlogService); enable(true);
    service.list('en', () => undefined, () => undefined);
    expect(api.list).toHaveBeenCalledWith('en', expect.any(Function), expect.any(Function));
    settingsError(); expect(service.enabled()).toBe(false); expect(service.error()).toBe(true);
  });
  it('does not trust an enabled setting from an offline cache', () => {
    const service = TestBed.inject(PublicBlogService); enable(true, false);
    expect(service.enabled()).toBe(false); expect(service.ready()).toBe(false);
    enable(true, true); expect(service.enabled()).toBe(true); expect(service.ready()).toBe(true);
  });
  it('rejects private paths, foreign posts and token URLs before accessing storage', async () => {
    const service = TestBed.inject(PublicBlogService); enable(true);
    for (const path of ['blog-drafts/article/x.png', 'blog-public/en-other/v1/x.png', 'https://example.com/x.png']) {
      await expect(service.image(path, 'es-post', 'v1')).rejects.toThrow();
    }
    expect(api.image).not.toHaveBeenCalled();
  });
  it('rejects an in-flight image when the blog is disabled', async () => {
    const service = TestBed.inject(PublicBlogService); enable(true);
    let finish!: (blob: Blob) => void;
    api.image.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const download = service.image('blog-public/es-post/v1/x.png', 'es-post', 'v1');
    enable(false); finish(new Blob()); await expect(download).rejects.toThrow();
  });
});
