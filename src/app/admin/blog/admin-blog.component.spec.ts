import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import { mockMethods } from 'src/testing/mock-methods';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AdminBlogComponent } from './admin-blog.component';
import { AdminBlogService } from './admin-blog.service';
import { AdminAuthService } from '../auth/admin-auth.service';
import type { BlogDraft } from '../../models/blog-draft';
import { PublicBlogService } from '../../blog/public-blog.service';

describe('Private blog editor', () => {
  const admin = signal(true);
  const record: BlogDraft = { id: 'article', title: 'Title', slug: 'title', excerpt: 'Excerpt', locale: 'es',
    tags: ['Angular'], contentHtml: '<h2>Heading</h2><p>Body</p>', contentFormat: 'html', contentVersion: 1,
    status: 'draft', revision: 1, authorUid: 'admin' };
  let service: Mocked<AdminBlogService>;
  let fixture: ComponentFixture<AdminBlogComponent>;
  beforeEach(async () => {
    localStorage.setItem('nullsite.locale', 'es');
    admin.set(true);
    service = mockMethods('blog', ['list', 'newId', 'save', 'remove', 'image', 'upload', 'publish', 'unpublish', 'setEnabled']);
    service.list.mockResolvedValue([record]); service.newId.mockReturnValue('new'); service.save.mockResolvedValue();
    await TestBed.configureTestingModule({ imports: [AdminBlogComponent], providers: [provideRouter([]),
      { provide: AdminBlogService, useValue: service },
      { provide: PublicBlogService, useValue: { enabled: signal(false), ready: signal(true), error: signal(false) } },
      { provide: AdminAuthService, useValue: { isAdmin: admin, access: () => admin() ? 'admin' : 'anonymous',
        user: () => ({ uid: 'admin' }) } },
    ] }).compileComponents();
    fixture = TestBed.createComponent(AdminBlogComponent); fixture.detectChanges(); await fixture.whenStable();
  });
  it('lists private drafts without a direct public reader link', () => {
    expect(fixture.componentInstance.records()).toEqual([record]);
    expect(fixture.nativeElement.querySelector('[routerLink="/blog"]')).toBeNull();
  });
  it('requires explicit confirmation and publishes only the saved record', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await fixture.componentInstance.publication(record, true); expect(service.publish).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await fixture.componentInstance.publication(record, true); expect(service.publish).toHaveBeenCalledWith(record);
    expect(service.setEnabled).not.toHaveBeenCalled();
  });
  it('refuses publishing while an editor has unsaved changes', async () => {
    fixture.componentInstance.edit(record); fixture.componentInstance.form.markAsDirty();
    await fixture.componentInstance.publication(record, true);
    expect(service.publish).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('Guarda o cancela');
  });
  it('withdraws explicitly without deleting the draft', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await fixture.componentInstance.publication({ ...record, publicationKey: 'es-title', publishedRevision: 1 }, false);
    expect(service.unpublish).toHaveBeenCalled(); expect(service.remove).not.toHaveBeenCalled();
  });
  it('activates the blog only through a confirmed independent settings action', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await fixture.componentInstance.toggleBlog(); expect(service.setEnabled).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await fixture.componentInstance.toggleBlog(); expect(service.setEnabled).toHaveBeenCalledWith(true);
    expect(service.publish).not.toHaveBeenCalled();
  });
  it('preserves the public-version pointer when saving a newer private draft', async () => {
    const published = { ...record, publicationKey: 'es-title', publishedRevision: 1 };
    const component = fixture.componentInstance; component.edit(published);
    component.form.controls.title.setValue('Private update'); component.form.markAsDirty();
    await component.save();
    expect(service.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft',
      publicationKey: 'es-title', publishedRevision: 1, title: 'Private update' }), published);
    expect(service.publish).not.toHaveBeenCalled();
  });
  it('saves a sanitized private HTML draft with separate tags', async () => {
    const component = fixture.componentInstance; component.edit(null);
    component.form.patchValue({ title: 'New', slug: 'new', tags: 'Angular, Firebase',
      contentHtml: '<h2>Safe</h2><script>alert(1)</script><p onclick="evil()">Body</p>' });
    component.form.markAsDirty(); await component.save();
    expect(service.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'draft',
      contentHtml: '<h2>Safe</h2><p>Body</p>', tags: ['Angular', 'Firebase'] }), null);
    expect(component.warning()).toBe(true); expect(component.hasUnsavedChanges()).toBe(false);
  });
  it('preserves supported HTML through visual → HTML round trip without false dirty edits', () => {
    const component = fixture.componentInstance; component.edit(record);
    component.switchMode('visual'); fixture.detectChanges(); component.switchMode('html');
    expect(component.form.controls.contentHtml.value).toBe(record.contentHtml);
    expect(component.hasUnsavedChanges()).toBe(false);
  });
  it('preserves image paths and alt text through the visual placeholder round trip', () => {
    const component = fixture.componentInstance;
    component.edit({ ...record, contentHtml: '<p>Body</p><img src="blog-drafts/article/id.png" alt="Picture">' });
    component.switchMode('visual'); fixture.detectChanges(); component.switchMode('html');
    expect(component.form.controls.contentHtml.value).toContain('src="blog-drafts/article/id.png"');
    expect(component.form.controls.contentHtml.value).toContain('alt="Picture"');
    expect(component.hasUnsavedChanges()).toBe(false);
  });
  it('keeps edits on conflict and slug collision', async () => {
    const component = fixture.componentInstance; component.edit(record); component.form.markAsDirty();
    service.save.mockRejectedValue(new Error('blog-conflict')); await component.save();
    expect(component.hasUnsavedChanges()).toBe(true); expect(component.error()).toContain('otro dispositivo');
    service.save.mockRejectedValue(new Error('blog-slug-taken')); await component.save();
    expect(component.hasUnsavedChanges()).toBe(true); expect(component.error()).toContain('slug');
  });
  it('cancel preserves edits when discard is rejected', () => {
    const component = fixture.componentInstance; component.edit(record); component.form.markAsDirty();
    vi.spyOn(window, 'confirm').mockReturnValue(false); component.cancel();
    expect(component.activeId()).toBe(record.id); expect(component.hasUnsavedChanges()).toBe(true);
  });
  it('blocks invalid empty, duplicate-tag and malformed slug saves', async () => {
    const component = fixture.componentInstance; component.edit(null); await component.save();
    component.form.patchValue({ title: 'Title', slug: 'title', tags: 'one, one', contentHtml: '<p>Body</p>' });
    await component.save(); expect(service.save).not.toHaveBeenCalled();
  });
  it('clears sensitive editor state after access is revoked', () => {
    const component = fixture.componentInstance; component.edit(record); admin.set(false); fixture.detectChanges();
    expect(component.records()).toEqual([]); expect(component.form.controls.contentHtml.value).toBe('');
    expect(component.activeId()).toBeNull();
  });
  it('does not restore drafts when a pending server load resolves after revocation', async () => {
    let resolve!: (drafts: BlogDraft[]) => void;
    service.list.mockReturnValue(new Promise<BlogDraft[]>(done => { resolve = done; }));
    const component = fixture.componentInstance; const load = component.load();
    admin.set(false); fixture.detectChanges(); resolve([record]); await load;
    expect(component.records()).toEqual([]);
  });
  it('prevents submission once administrator access is lost', async () => {
    const component = fixture.componentInstance; component.edit(record); admin.set(false); await component.save();
    expect(service.save).not.toHaveBeenCalled();
  });
});
