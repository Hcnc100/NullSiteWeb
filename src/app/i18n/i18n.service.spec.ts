import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { I18nService, localeFromPath, preferredLocale } from './i18n.service';
import { localizedText, messages } from './translations';

describe('Runtime bilingual navigation', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));
  it('prioritizes URL, saved choice, then browser preference', () => {
    expect(preferredLocale('/en/home', 'es', 'es-MX')).toBe('en');
    expect(preferredLocale('/home', 'es', 'en-US')).toBe('es');
    expect(preferredLocale('/home', null, 'en-US')).toBe('en');
    expect(preferredLocale('/home', 'invalid', 'fr')).toBe('es');
    expect(localeFromPath('/english')).toBeUndefined();
  });
  it('updates document language and runtime messages', () => {
    const service = TestBed.inject(I18nService);
    service.setLocale('en');
    expect(document.documentElement.lang).toBe('en');
    expect(service.text('Guardar cambios')).toBe('Save changes');
    expect(service.publicUrl('project')).toBe('/en/project');
    service.setLocale('es');
    expect(service.text('Guardar cambios')).toBe('Guardar cambios');
  });
  it('preserves section, query and fragment on switch', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/es/project?view=grid#work');
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await TestBed.inject(I18nService).switchLocale('en');
    expect(navigate).toHaveBeenCalledWith('/en/project?view=grid#work');
  });
  it('switches admin language without navigating', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/admin/projects');
    const navigate = vi.spyOn(router, 'navigateByUrl');
    await TestBed.inject(I18nService).switchLocale('en');
    expect(navigate).not.toHaveBeenCalled();
  });
  it('falls back to legacy text without auto-translating', () => {
    expect(localizedText('Original', { en: { name: 'Translated' } }, 'en', 'name')).toBe('Translated');
    expect(localizedText('Original', { en: { name: ' ' } }, 'en', 'name')).toBe('Original');
    expect(localizedText('Original', undefined, 'en', 'name')).toBe('Original');
    expect(Object.values(messages).every(pair => pair.length === 2 && pair.every(text => text.length > 0))).toBe(true);
  });
});
