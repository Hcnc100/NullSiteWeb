import type { Mocked } from 'vitest';
import { mockMethods } from 'src/testing/mock-methods';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AdminContentComponent } from './admin-content.component';
import { AdminContentService } from './admin-content.service';
import { AdminAuthService } from '../auth/admin-auth.service';

describe('Content editor', () => {
  const admin = signal(true);
  const record = { id: 'p', name: 'Project', description: 'Text', urlImg: 'https://example.com/a.png' };
  let service: Mocked<AdminContentService>;
  beforeEach(async () => {
    admin.set(true);
    service = mockMethods('content', ['list', 'newId', 'save', 'remove', 'importSkills']);
    service.list.mockResolvedValue([record]); service.newId.mockReturnValue('new'); service.save.mockResolvedValue();
    await TestBed.configureTestingModule({ imports: [AdminContentComponent], providers: [provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { data: { kind: 'projects' } } } },
      { provide: AdminContentService, useValue: service },
      { provide: AdminAuthService, useValue: { isAdmin: admin, access: () => admin() ? 'admin' : 'anonymous' } },
    ] }).compileComponents();
  });
  async function setup(): Promise<AdminContentComponent> {
    const fixture = TestBed.createComponent(AdminContentComponent);
    fixture.detectChanges(); await fixture.whenStable(); return fixture.componentInstance;
  }
  it('loads existing records and retains mobile URLs in the form', async () => {
    const component = await setup(); component.edit(record);
    expect(component.form.controls.urlImg.value).toBe(record.urlImg);
    expect(component.hasUnsavedChanges()).toBe(false);
  });
  it('edits and removes individual captures while retaining their metadata', async () => {
    const c = await setup();
    c.edit({ ...record, gallery: ['https://example.com/old.png', 'https://example.com/two.png'] });
    c.galleryMetadata.at(0).controls.alt.setValue('My screenshot');
    c.galleryMetadata.at(0).controls.url.setValue('https://example.com/new.png');
    c.removeCapture(1);
    expect(c.hasUnsavedChanges()).toBe(true);
    expect(service.save).not.toHaveBeenCalled();
    await c.save();
    expect(service.save).toHaveBeenCalledWith('projects', expect.objectContaining({
      gallery: ['https://example.com/new.png'],
      galleryItems: [expect.objectContaining({ url: 'https://example.com/new.png', alt: 'My screenshot', order: 0 })],
    }), expect.anything());
  });
  it('requires a valid URL for a new capture and allows removing it without saving', async () => {
    const c = await setup(); c.edit(record); c.addCapture();
    await c.save(); expect(service.save).not.toHaveBeenCalled();
    c.galleryMetadata.at(0).controls.url.setValue('javascript:alert(1)');
    await c.save(); expect(service.save).not.toHaveBeenCalled();
    c.removeCapture(0); expect(c.galleryMetadata.valid).toBe(true);
    expect(c.form.controls.gallery.value).toBe('');
  });
  it('saves a new project with translations and legacy gallery', async () => {
    const component = await setup(); component.edit(null);
    component.form.patchValue({ name: 'New', urlImg: record.urlImg, gallery: 'https://example.com/b.png', enName: 'English' });
    component.form.markAsDirty(); await component.save();
    expect(service.save).toHaveBeenCalledWith('projects', expect.objectContaining({ id: 'new', gallery: ['https://example.com/b.png'] }), null);
    expect(component.hasUnsavedChanges()).toBe(false);
  });
  it('keeps dirty edits when a concurrent save fails', async () => {
    const component = await setup(); component.edit(record); component.form.markAsDirty();
    service.save.mockRejectedValue(new Error('content-conflict')); await component.save();
    expect(component.hasUnsavedChanges()).toBe(true); expect(component.error()).toContain('otro dispositivo');
  });
  it('does not save after admin access is lost', async () => {
    const component = await setup(); component.edit(record); admin.set(false); await component.save();
    expect(service.save).not.toHaveBeenCalled();
  });
  it('keeps image metadata attached to URLs when reordered and saves it with mobile-compatible URLs', async () => {
    const c = await setup(); const a = 'https://example.com/one.png', b = 'https://example.com/two.png';
    const original = { ...record, gallery: [a, b], coverAlt: 'Logo', thumbnailUrl: 'https://example.com/thumb.png',
      galleryItems: [{ url: a, order: 0, alt: 'Original', translations: { en: { alt: 'Original EN' } } }] };
    c.edit(original); c.galleryMetadata.at(0).controls.alt.setValue('Edited');
    c.galleryMetadata.at(0).controls.esAlt.setValue('Inicio');
    c.form.controls.gallery.setValue(`${b}\n${a}`);
    expect(c.galleryMetadata.at(1).controls.alt.value).toBe('Edited');
    expect(c.galleryMetadata.at(1).controls.enAlt.value).toBe('Original EN');
    expect(c.hasUnsavedChanges()).toBe(true); await c.save();
    expect(service.save).toHaveBeenCalledWith('projects', expect.objectContaining({ gallery: [b, a], coverAlt: 'Logo',
      galleryItems: expect.arrayContaining([expect.objectContaining({ url: a, alt: 'Edited', order: 1 })]) }), original);
  });
  it('does not carry image descriptions from a different project with the same image URL', async () => {
    const c = await setup(); const url = 'https://example.com/shared.png';
    c.edit({ ...record, gallery: [url], galleryItems: [{ url, alt: 'First project', order: 0 }] });
    c.edit({ ...record, id: 'other', gallery: [url], galleryItems: [{ url, alt: 'Other project', order: 0 }] });
    expect(c.galleryMetadata.at(0).controls.alt.value).toBe('Other project');
  });
  it('reports editorial gaps honestly without inventing descriptions or blocking compatible legacy saves', async () => {
    const c = await setup(); c.edit(record);
    expect(c.editorialGaps()).toContain('en · description'); expect(c.editorialGaps()).toContain('alt · portada');
    c.form.patchValue({ esName: 'Project', enName: 'Project', esDescription: 'Texto', enDescription: 'Text',
      coverAlt: 'Cover', esCoverAlt: 'Portada', enCoverAlt: 'Cover' });
    expect(c.editorialGaps()).toEqual([]);
  });
});
