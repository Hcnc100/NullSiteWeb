import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import { mockMethods } from 'src/testing/mock-methods';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BlogRendererComponent } from './blog-renderer.component';
import { AdminBlogService } from './admin-blog.service';
import { AdminAuthService } from '../auth/admin-auth.service';

describe('Private preview renderer', () => {
  const admin = signal(true);
  let service: Mocked<AdminBlogService>;
  beforeEach(() => {
    admin.set(true); service = mockMethods('blog', ['image']);
    service.image.mockResolvedValue(new Blob(['image'], { type: 'image/png' }));
    TestBed.configureTestingModule({ imports: [BlogRendererComponent], providers: [
      { provide: AdminBlogService, useValue: service }, { provide: AdminAuthService, useValue: { isAdmin: admin } },
    ] });
  });
  it('sanitizes malicious HTML and blocks external image requests', () => {
    const fixture = TestBed.createComponent(BlogRendererComponent);
    fixture.componentRef.setInput('draftId', 'article');
    fixture.componentRef.setInput('html', '<h2>Safe</h2><script>alert(1)</script><img src="https://evil.test/tracker">');
    fixture.detectChanges(); expect(fixture.componentInstance.rendered()).toBe('<h2>Safe</h2>');
    expect(service.image).not.toHaveBeenCalled();
  });
  it('loads private blobs with authentication and revokes object URLs on destroy', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/local-image');
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const fixture = TestBed.createComponent(BlogRendererComponent);
    fixture.componentRef.setInput('draftId', 'article');
    fixture.componentRef.setInput('html', '<img src="blog-drafts/article/id.png" alt="Private">');
    fixture.detectChanges(); await fixture.whenStable();
    expect(service.image).toHaveBeenCalledWith('blog-drafts/article/id.png', 'article');
    expect(fixture.componentInstance.rendered()).toContain('blob:http://localhost/local-image');
    fixture.destroy(); expect(revoke).toHaveBeenCalledWith('blob:http://localhost/local-image');
  });
  it('does not restore a late image response after permission loss', async () => {
    let resolve!: (blob: Blob) => void;
    service.image.mockReturnValue(new Promise<Blob>(done => { resolve = done; }));
    const fixture = TestBed.createComponent(BlogRendererComponent);
    fixture.componentRef.setInput('draftId', 'article');
    fixture.componentRef.setInput('html', '<img src="blog-drafts/article/id.png" alt="Private">');
    fixture.detectChanges(); admin.set(false); fixture.detectChanges();
    resolve(new Blob(['image'])); await fixture.whenStable();
    expect(fixture.componentInstance.rendered()).toBe('');
  });
});
