import { imageAlt, missingTranslations, thumbnailUrl } from './project-media';
import type { Translations } from '../i18n/translations';

describe('Editorial media localization', () => {
  it('uses the requested description, original description, then an honest fallback', () => {
    const translations = { en: { alt: 'Home screen' } };
    expect(imageAlt('Inicio', translations, 'en', 'App')).toBe('Home screen');
    expect(imageAlt('Inicio', translations, 'es', 'App')).toBe('Inicio');
    expect(imageAlt('', undefined, 'en', 'App screenshot 1')).toBe('App screenshot 1');
  });
  it('fails safely on malformed runtime translation fields', () => {
    expect(imageAlt('Original', { en: { alt: 3 } } as unknown as Translations, 'en', 'Fallback')).toBe('Original');
  });
  it('uses only HTTPS thumbnails and keeps originals available', () => {
    expect(thumbnailUrl('https://example.com/small.png', 'https://example.com/full.png')).toContain('small');
    expect(thumbnailUrl('javascript:evil()', 'https://example.com/full.png')).toContain('full');
    expect(thumbnailUrl(undefined, 'http://unsafe.example/image')).toBe('');
  });
  it('reports explicit missing translations without treating original text as translated', () => {
    expect(missingTranslations({ es: { name: 'Marca', description: 'Descripción' }, en: { name: 'Marca' } }, ['name', 'description']))
      .toEqual(['en · description']);
  });
});
