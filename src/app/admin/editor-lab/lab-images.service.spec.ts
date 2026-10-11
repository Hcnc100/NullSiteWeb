import { TestBed } from '@angular/core/testing';
import { LabImagesService } from './lab-images.service';
import { AdminAuthService } from '../auth/admin-auth.service';
import { AdminBlogService } from '../blog/admin-blog.service';

describe('Laboratory private Firebase images', () => {
  const upload = vi.fn().mockResolvedValue('blog-drafts/editor-lab/test.png');
  let access = 'admin';
  beforeEach(() => {
    access = 'admin'; upload.mockClear();
    TestBed.configureTestingModule({ providers: [LabImagesService,
      { provide: AdminAuthService, useValue: { whenReady: async () => access, isAdmin: () => access === 'admin' } },
      { provide: AdminBlogService, useValue: { upload } },
    ] });
  });
  async function png(): Promise<File> {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(value => resolve(value!), 'image/png'));
    return new File([blob], 'pixel.png', { type: 'image/png' });
  }
  it('uses the existing administrator uploader and a fixed private draft namespace', async () => {
    const file = await png();
    expect(await TestBed.inject(LabImagesService).upload(file)).toBe('blog-drafts/editor-lab/test.png');
    expect(upload).toHaveBeenCalledWith('editor-lab', file, expect.any(Function));
  });
  it('stages bytes without authentication or network and uploads only referenced images when saving', async () => {
    const service = TestBed.inject(LabImagesService); access = 'anonymous';
    const path = await service.stage(await png());
    const unused = await service.stage(await png());
    expect(upload).not.toHaveBeenCalled();
    expect(await service.image(path)).toMatch(/^blob:/);
    access = 'admin';
    const html = `<p>Prueba</p><img data-image-path="${path}" alt="Prueba">`;
    const saved = await service.persistHtml(html);
    expect(saved).toContain('blog-drafts/editor-lab/test.png'); expect(saved).not.toContain('pending-');
    expect(upload).toHaveBeenCalledTimes(1);
    await service.persistHtml(html); expect(upload).toHaveBeenCalledTimes(1);
    expect(unused).not.toBe(path);
  });
  it('rejects unauthenticated uploads and unsupported files', async () => {
    access = 'anonymous'; const service = TestBed.inject(LabImagesService);
    await expect(service.upload(await png())).rejects.toThrow('administrador');
    await expect(service.upload(new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }))).rejects.toThrow('10 MB');
    expect(upload).not.toHaveBeenCalled();
    await expect(service.image('https://bad.test/x.png')).rejects.toThrow('Ruta');
  });
  it('rejects unsafe URL forms before fetching and imports HTTPS bytes without credentials', async () => {
    const service = TestBed.inject(LabImagesService);
    const fetcher = vi.spyOn(globalThis, 'fetch');
    try {
      for (const url of ['http://example.com/x.png', 'https://127.0.0.1/x.png', 'https://user:pass@example.com/x.png', 'https://example.local/x.png']) await expect(service.fromUrl(url)).rejects.toThrow();
      expect(fetcher).not.toHaveBeenCalled();
      fetcher.mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } }));
      const file = await service.fromUrl('https://example.com/x.png');
      expect(file.type).toBe('image/png'); expect(file.size).toBe(3);
      expect(fetcher).toHaveBeenCalledWith('https://example.com/x.png', expect.objectContaining({ credentials: 'omit', redirect: 'error' }));
    } finally { fetcher.mockRestore(); }
  });
});
