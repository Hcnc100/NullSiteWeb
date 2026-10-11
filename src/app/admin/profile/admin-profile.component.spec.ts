import { vi } from 'vitest';
import type { Mocked } from 'vitest';
import { mockMethods } from 'src/testing/mock-methods';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { AdminAuthService } from '../auth/admin-auth.service';
import type { AdminAccess } from '../auth/admin-auth.service';
import { AdminProfileService } from './admin-profile.service';
import { AdminProfileComponent } from './admin-profile.component';
import type { EditableProfile } from '../../models/profile-editor.model';

describe('AdminProfileComponent', () => {
  let fixture: ComponentFixture<AdminProfileComponent>;
  let component: AdminProfileComponent;
  let service: Mocked<AdminProfileService>;
  const access = signal<AdminAccess>('admin');
  const profile: EditableProfile = {
    name: 'Ricardo', profession: 'Developer', description: 'About me', urlImg: 'https://example.com/photo.webp',
  };

  beforeEach(async () => {
    access.set('admin');
    service = mockMethods<AdminProfileService>('profile', ['load', 'save']);
    service.load.mockReturnValue(Promise.resolve(profile));
    service.save.mockReturnValue(Promise.resolve());
    TestBed.configureTestingModule({ imports: [AdminProfileComponent], providers: [
      { provide: AdminAuthService, useValue: { access, isAdmin: (): boolean => access() === 'admin' } },
      { provide: AdminProfileService, useValue: service },
    ] });
    fixture = TestBed.createComponent(AdminProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  function editName(name: string): void {
    component.form.controls.name.setValue(name);
    component.form.markAsDirty();
  }

  it('loads existing data with the legacy social links as defaults', () => {
    expect(component.form.controls.name.value).toBe('Ricardo');
    expect(component.form.controls.github.value).toBe('https://github.com/Hcnc100');
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('saves only editable data and passes the original baseline for conflict detection', async () => {
    editName('Updated');
    await component.save();
    const [updated, baseline] = service.save.mock.calls.at(-1)!;
    expect(updated.name).toBe('Updated');
    expect(baseline).toEqual(profile);
    expect(component.message()).toContain('Perfil guardado');
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('does not persist unsafe URLs', async () => {
    component.form.controls.github.setValue('javascript:alert(1)');
    component.form.markAsDirty();
    await component.save();
    expect(service.save).not.toHaveBeenCalled();
  });

  it('supports explicitly removing a social link', async () => {
    component.form.controls.github.setValue('');
    component.form.markAsDirty();
    await component.save();
    expect(service.save.mock.calls.at(-1)![0].socialLinks?.some(link => link.platform === 'github')).toBe(false);
  });

  it('keeps unsaved changes after a conflict', async () => {
    service.save.mockReturnValue(Promise.reject(new Error('profile-conflict')));
    editName('Local draft');
    await component.save();
    expect(component.error()).toContain('otro dispositivo');
    expect(component.form.controls.name.value).toBe('Local draft');
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('keeps unsaved changes after a failed write', async () => {
    service.save.mockReturnValue(Promise.reject(new Error('permission-denied')));
    editName('Local draft');
    await component.save();
    expect(component.error()).toContain('No se pudo guardar');
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('does not destroy edits during a routine token refresh', () => {
    editName('Local draft');
    access.set('loading');
    fixture.detectChanges();
    expect(component.form.controls.name.value).toBe('Local draft');
  });

  it('clears private editor state when authorization is lost', () => {
    editName('Local draft');
    access.set('forbidden');
    fixture.detectChanges();
    expect(component.form.controls.name.value).toBe('');
    expect(component.loaded()).toBe(false);
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('warns before closing a tab with unsaved changes', () => {
    editName('Local draft');
    const event = new Event('beforeunload', { cancelable: true });
    component.beforeUnload(event as BeforeUnloadEvent);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not discard dirty data when reload is cancelled', async () => {
    editName('Local draft');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await component.load();
    expect(service.load.mock.calls.length).toBe(1);
    expect(component.form.controls.name.value).toBe('Local draft');
  });
});
