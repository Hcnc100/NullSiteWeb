
import { contentPatch, contentFingerprint, defaultSkills, validImage } from './managed-content';
import type { ManagedContent } from './managed-content';

describe('Managed content compatibility and validation', () => {
  const project: ManagedContent = { id: 'p', name: ' App ', description: 'Text', urlImg: 'https://example.com/a.png' };
  it('keeps mobile gallery URLs and adds ordered gallery metadata', () => {
    const patch = contentPatch('projects', { ...project, gallery: ['https://example.com/b.png'] });
    expect(patch['gallery']).toEqual(['https://example.com/b.png']);
    expect(patch['galleryItems']).toEqual([{ url: 'https://example.com/b.png', order: 0, alt: ' App  1' }]);
    expect(patch['name']).toBe('App');
  });
  it('rejects unsafe links, credentials, missing cover and blank names', () => {
    for (const urlImg of ['', 'javascript:alert(1)', 'http://example.com', 'https://a:b@example.com']) {
      expect(() => contentPatch('projects', { ...project, urlImg })).toThrowError(new Error("content-invalid"));
    }
    expect(() => contentPatch('projects', { ...project, name: ' ' })).toThrow();
  });
  it('writes translated fields individually', () => {
    const patch = contentPatch('projects', { ...project, translations: { en: { name: ' English ' } } });
    expect(patch['translations.en.name']).toBe('English');
    expect(patch['translations']).toBeUndefined();
  });
  it('preserves edited gallery descriptions, localized alt and thumbnails by URL rather than position', () => {
    const a = 'https://example.com/a.png', b = 'https://example.com/b.png';
    const patch = contentPatch('projects', { ...project, gallery: [b, a], coverAlt: 'Cover',
      thumbnailUrl: 'https://example.com/small.png', translations: { en: { coverAlt: 'English cover' } },
      galleryItems: [{ url: a, order: 0, alt: 'Inicio', translations: { en: { alt: 'Home screen' } } },
        { url: b, order: 1, alt: 'Detalle', thumbnailUrl: 'https://example.com/small-b.png' }] });
    expect(patch['translations.en.coverAlt']).toBe('English cover');
    expect(patch['galleryItems']).toEqual([
      { url: b, order: 0, alt: 'Detalle', thumbnailUrl: 'https://example.com/small-b.png', translations: { es: { alt: '' }, en: { alt: '' } } },
      { url: a, order: 1, alt: 'Inicio', thumbnailUrl: '', translations: { es: { alt: '' }, en: { alt: 'Home screen' } } },
    ]);
  });
  it('rejects unsafe thumbnails and overlong localized image descriptions', () => {
    expect(() => contentPatch('projects', { ...project, thumbnailUrl: 'javascript:evil()' })).toThrow();
    expect(() => contentPatch('projects', { ...project, translations: { en: { coverAlt: 'x'.repeat(301) } } })).toThrow();
    expect(() => contentPatch('projects', { ...project, gallery: ['https://example.com/b.png'],
      galleryItems: [{ url: 'https://example.com/b.png', order: 0, alt: 'Valid', thumbnailUrl: 'http://unsafe.example/x' }] })).toThrow();
  });
  it('detects concurrent media edits instead of overwriting mobile/admin descriptions', () => {
    expect(contentFingerprint('projects', project)).not.toBe(contentFingerprint('projects', { ...project, coverAlt: 'Changed' }));
    expect(contentFingerprint('projects', project)).not.toBe(contentFingerprint('projects', { ...project,
      galleryItems: [{ url: 'https://example.com/b.png', order: 0, alt: 'Changed' }] }));
  });
  it('ignores counters but detects editable changes', () => {
    expect(contentFingerprint('projects', project)).toBe(contentFingerprint('projects', { ...project, views: 99 }));
    expect(contentFingerprint('projects', project)).not.toBe(contentFingerprint('projects', { ...project, name: 'New' }));
  });
  it('retains nine historical skills and validates each seed', () => {
    expect(defaultSkills.length).toBe(9);
    expect(new Set(defaultSkills.map(skill => skill.id)).size).toBe(9);
    for (const skill of defaultSkills) expect(() => contentPatch('skills', skill)).not.toThrow();
  });
  it('rejects invalid skills and executable SVG uploads', () => {
    expect(() => contentPatch('skills', { ...defaultSkills[0], sortOrder: -1 })).toThrow();
    expect(validImage(new File(['svg'], 'test.svg', { type: 'image/svg+xml' }))).toBe(false);
    expect(validImage(new File(['image'], 'test.png', { type: 'image/png' }))).toBe(true);
  });
});
