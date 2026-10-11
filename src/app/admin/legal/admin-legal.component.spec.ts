import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import { mockMethods } from 'src/testing/mock-methods';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { AdminLegalComponent } from './admin-legal.component';
import { AdminLegalService } from './admin-legal.service';
import { AdminAuthService } from '../auth/admin-auth.service';
import type { LegalDraft, LegalRecord } from './legal-editor.model';

describe('Private legal editor', () => {
  const admin = signal(true);
  const publicValue = { title: 'Policy', content: '<h2>Section</h2><p>Body</p>' };
  const draft: LegalDraft = { id: 'stable', ...publicValue, base: publicValue, revision: 1, publishedRevision: 0 };
  const record: LegalRecord = { id: 'stable', published: publicValue, draft };
  let service: Mocked<AdminLegalService>;
  let fixture: ComponentFixture<AdminLegalComponent>;
  beforeEach(async () => {
    localStorage.setItem('nullsite.locale', 'es'); admin.set(true);
    service = mockMethods('legal', ['list', 'newId', 'save', 'publish', 'history']);
    service.list.mockResolvedValue([record]); service.newId.mockReturnValue('new'); service.history.mockResolvedValue([]);
    service.save.mockResolvedValue({ ...draft, revision: 2 }); service.publish.mockResolvedValue({ ...draft, publishedRevision: 1 });
    await TestBed.configureTestingModule({ imports: [AdminLegalComponent], providers: [
      { provide: AdminLegalService, useValue: service },
      { provide: AdminAuthService, useValue: { isAdmin: admin, access: () => admin() ? 'admin' : 'anonymous' } },
    ] }).compileComponents();
    fixture = TestBed.createComponent(AdminLegalComponent); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
  });
  it('lists documents and keeps stable public URLs', () => {
    expect(fixture.componentInstance.records()).toEqual([record]);
    expect(fixture.nativeElement.querySelector('a')?.getAttribute('href')).toBe('/es/terms-and-conditions/stable');
  });
  it('normalizes and previews unsafe HTML with the same reader before saving a private draft', async () => {
    const c = fixture.componentInstance; c.edit(record);
    c.form.controls.content.setValue('<h2>Safe</h2><p onclick="evil()">Body</p><script>bad()</script>'); c.form.markAsDirty();
    await c.save(); expect(service.save).not.toHaveBeenCalled();
    c.normalize(); fixture.detectChanges();
    expect(c.preview()?.content).toBe('<h2>Safe</h2><p>Body</p>');
    expect(fixture.nativeElement.querySelector('.legal-document__content script')).toBeNull();
    await c.save(); expect(service.save).toHaveBeenCalled(); expect(service.publish).not.toHaveBeenCalled();
    expect(c.hasUnsavedChanges()).toBe(false);
  });
  it('requires distinct confirmation and saved state for publication', async () => {
    const c = fixture.componentInstance; c.edit(record); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await c.publish(); expect(service.publish).not.toHaveBeenCalled();
    confirm.mockReturnValue(true); c.form.markAsDirty(); await c.publish(); expect(service.publish).not.toHaveBeenCalled();
    c.form.markAsPristine(); await c.publish(); expect(service.publish).toHaveBeenCalledWith(draft);
  });
  it('normalizes title whitespace as well as HTML so saving cannot get stuck', async () => {
    const c = fixture.componentInstance; c.edit(record); c.form.controls.title.setValue('  Policy  ');
    c.form.markAsDirty(); await c.save(); expect(service.save).not.toHaveBeenCalled();
    c.normalize(); expect(c.form.controls.title.value).toBe('Policy'); await c.save();
    expect(service.save).toHaveBeenCalled();
  });
  it('round trips supported HTML through visual mode without false dirty changes', () => {
    const c = fixture.componentInstance; c.edit(record); c.switchMode('visual'); fixture.detectChanges();
    c.switchMode('html'); expect(c.form.controls.content.value).toBe(publicValue.content);
    expect(c.hasUnsavedChanges()).toBe(false);
  });
  it('only pastes plain text and never activates clipboard HTML', () => {
    const c = fixture.componentInstance; c.edit(record); c.switchMode('visual'); fixture.detectChanges();
    const event = { preventDefault: vi.fn(), clipboardData: { getData: (type: string) => type === 'text/plain'
      ? '<img src="https://example.com/track" onerror="evil()">' : '<script>evil()</script>' } } as unknown as ClipboardEvent;
    c.paste(event); fixture.detectChanges();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.legal-visual img')).toBeNull();
    expect(c.form.controls.content.value).toContain('&lt;img'); expect(c.hasUnsavedChanges()).toBe(true);
  });
  it('blocks native rich paste/drop before insertion and rejects unsafe visual links', () => {
    const c = fixture.componentInstance; c.edit(record); c.switchMode('visual'); fixture.detectChanges();
    const event = { inputType: 'insertFromDrop', preventDefault: vi.fn() } as unknown as InputEvent;
    c.preventNativeInsert(event); expect(event.preventDefault).toHaveBeenCalled();
    c.link.setValue('javascript:evil()'); c.insert('a'); expect(c.error()).toContain('enlace');
    expect(fixture.nativeElement.querySelector('.legal-visual a')).toBeNull();
  });
  it('creates a blank formatting scaffold that cannot publish as a fabricated policy', async () => {
    const c = fixture.componentInstance; c.edit(null); c.form.controls.title.setValue('New'); c.structure(); fixture.detectChanges();
    await c.save(); expect(service.save).not.toHaveBeenCalled(); expect(c.mode()).toBe('visual');
  });
  it('normalizes visual content without immediately recapturing stale unsanitized DOM', () => {
    const c = fixture.componentInstance; c.edit(record); c.switchMode('visual'); fixture.detectChanges();
    const editor: HTMLElement = fixture.nativeElement.querySelector('.legal-visual');
    editor.innerHTML = '<p style="color:red" onclick="evil()">Body</p>'; c.captureVisual(); c.normalize();
    expect(c.form.controls.content.value).toBe('<p>Body</p>'); expect(c.preview()?.content).toBe('<p>Body</p>');
  });
  it('rejects empty, active-only and oversized HTML without writes', async () => {
    const c = fixture.componentInstance; c.edit(null); c.form.controls.title.setValue('New');
    for (const content of ['', '<script>only()</script>', 'x'.repeat(500001)]) {
      c.form.controls.content.setValue(content); await c.save();
    }
    expect(service.save).not.toHaveBeenCalled();
  });
  it('preserves changes after save conflict', async () => {
    const c = fixture.componentInstance; c.edit(record); c.form.markAsDirty();
    service.save.mockRejectedValue(new Error('legal-conflict')); await c.save();
    expect(c.hasUnsavedChanges()).toBe(true); expect(c.error()).toContain('otro dispositivo');
  });
  it('does not switch or clear editor when discarding is declined', () => {
    const c = fixture.componentInstance; c.edit(record); c.form.markAsDirty(); vi.spyOn(window, 'confirm').mockReturnValue(false);
    c.edit(null); c.cancel(); expect(c.activeId()).toBe('stable');
  });
  it('copies history to an unsaved draft without publishing', () => {
    const c = fixture.componentInstance; c.edit(record); c.restore({ title: 'Old', content: '<p>Old</p>' });
    expect(c.form.controls.title.value).toBe('Old'); expect(c.hasUnsavedChanges()).toBe(true);
    expect(service.publish).not.toHaveBeenCalled(); expect(service.save).not.toHaveBeenCalled();
  });
  it('requires confirmation to adopt the public baseline', async () => {
    const c = fixture.componentInstance; const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    c.edit(record, true); expect(c.activeId()).toBeNull(); confirm.mockReturnValue(true);
    c.edit(record, true); await c.save(); expect(service.save).toHaveBeenCalledWith('stable', publicValue, draft, publicValue, true);
  });
  it('clears private state and blocks actions when access is revoked', async () => {
    const c = fixture.componentInstance; c.edit(record); c.form.markAsDirty(); admin.set(false); fixture.detectChanges();
    expect(c.activeId()).toBeNull(); expect(c.records()).toEqual([]); expect(c.form.controls.content.value).toBe('');
    await c.save(); await c.publish(); expect(service.save).not.toHaveBeenCalled(); expect(service.publish).not.toHaveBeenCalled();
  });
  it('ignores late private list results after access revocation', async () => {
    let resolve!: (records: LegalRecord[]) => void;
    service.list.mockReturnValue(new Promise(done => { resolve = done; }));
    const c = fixture.componentInstance; const pending = c.load(); admin.set(false); fixture.detectChanges();
    resolve([record]); await pending; expect(c.records()).toEqual([]);
  });
  it('warns on unload for unsaved edits and drops stale preview after editing', () => {
    const c = fixture.componentInstance; c.edit(record); c.showPreview();
    c.form.controls.title.setValue('Changed'); c.form.markAsDirty(); expect(c.preview()).toBeNull();
    const event = new Event('beforeunload', { cancelable: true }); c.beforeUnload(event as BeforeUnloadEvent);
    expect(event.defaultPrevented).toBe(true);
  });
  it('keeps the embedded preview free of a second page H1 and bounds content at small and large container widths', () => {
    const c = fixture.componentInstance; c.edit(record);
    c.form.patchValue({ title: 'Long'.repeat(40), content: '<h2>Section</h2><p>' + 'word'.repeat(300)
      + '</p><table><caption>Data</caption><tr><th>Header</th><td>Value</td></tr></table>' });
    c.showPreview(); fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.legal-preview h1')).toBeNull();
    expect(host.querySelector('#legal-title')?.getAttribute('aria-describedby')).toBe('legal-title-help');
    for (const width of [320, 768, 1440]) {
      host.style.display = 'block'; host.style.width = `${width}px`;
      expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth + 1);
    }
  });
});
