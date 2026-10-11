import { isHttpsUrl } from './profile-editor.model';
import type { Translations } from '../i18n/translations';
import type { ProjectImage } from './project-media';

export type ContentKind = 'projects' | 'skills';
export interface ManagedContent {
  id: string; name: string; description: string; translations?: Translations;
  urlImg?: string; urlRepo?: string; urlPlay?: string; gallery?: string[];
  galleryItems?: ProjectImage[]; coverAlt?: string; thumbnailUrl?: string;
  links?: { label: string; url: string }[]; technologyIds?: string[];
  category?: 'language' | 'tech'; iconKey?: string; color?: string; sortOrder?: number; published?: boolean;
  [key: string]: unknown;
}

export const iconKeys = ['python', 'java', 'javascript', 'android', 'angular', 'github', 'git', 'docker'] as const;
export const defaultSkills: ManagedContent[] = [
  ['python', 'Python', 'python', '#306998', 'language'], ['java', 'Java', 'java', '#f89820', 'language'],
  ['javascript', 'JavaScript', 'javascript', '#f0db4f', 'language'], ['kotlin', 'Kotlin', 'android', '#78C257', 'language'],
  ['dart', 'Dart', 'android', '#78C257', 'language'], ['angular', 'Angular', 'angular', '#a6120d', 'language'],
  ['github', 'Github', 'github', '#6e5494', 'tech'], ['git', 'Git', 'git', '#f34f29', 'tech'],
  ['docker', 'Docker', 'docker', '#0db7ed', 'tech'],
].map(([id, name, iconKey, color, category], sortOrder) => ({
  id, name, iconKey, color, category: category as 'language' | 'tech', description: '', sortOrder, published: true,
}));

export function contentPatch(kind: ContentKind, data: ManagedContent): Record<string, unknown> {
  if (data.name.trim().length === 0 || data.name.length > 120 || data.description.length > 10000) {
    throw new Error('content-invalid');
  }
  const result: Record<string, unknown> = { name: data.name.trim(), description: data.description.trim() };
  for (const locale of ['es', 'en'] as const) {
    for (const field of ['name', 'description']) {
      const value = data.translations?.[locale]?.[field] ?? '';
      if (value.length > (field === 'name' ? 120 : 10000)) throw new Error('content-invalid');
      result[`translations.${locale}.${field}`] = value.trim();
    }
  }
  if (kind === 'projects') {
    for (const locale of ['es', 'en'] as const) {
      const alt = data.translations?.[locale]?.['coverAlt'] ?? '';
      if (alt.length > 300) throw new Error('content-invalid');
      result[`translations.${locale}.coverAlt`] = alt.trim();
    }
    if ((data.coverAlt?.length ?? 0) > 300 || (data.thumbnailUrl !== undefined && data.thumbnailUrl !== ''
      && (!isHttpsUrl(data.thumbnailUrl) || data.thumbnailUrl.length > 2048))) throw new Error('content-invalid');
    const galleryItems = (data.gallery ?? []).map((url, order) => {
      const item = data.galleryItems?.find(image => image.url === url);
      const alt = item?.alt ?? `${data.name} ${order + 1}`;
      const translations = { es: { alt: item?.translations?.es?.['alt']?.trim() ?? '' },
        en: { alt: item?.translations?.en?.['alt']?.trim() ?? '' } };
      if (alt.length > 300 || Object.values(translations).some(value => value.alt.length > 300)
        || (item?.thumbnailUrl !== undefined && item.thumbnailUrl !== ''
          && (!isHttpsUrl(item.thumbnailUrl) || item.thumbnailUrl.length > 2048))) throw new Error('content-invalid');
      // Keep the historical shape when no richer metadata was supplied.
      return item === undefined ? { url, order, alt } : { url, order, alt: alt.trim(), translations, thumbnailUrl: item.thumbnailUrl ?? '' };
    });
    const urls = [data.urlImg ?? '', ...(data.gallery ?? []), ...(data.links ?? []).map(link => link.url)];
    for (const optional of [data.urlRepo, data.urlPlay]) { if (optional !== undefined && optional !== '') urls.push(optional); }
    if (urls.some(url => !isHttpsUrl(url) || url.length > 2048) || urls.length > 60
      || (data.technologyIds?.length ?? 0) > 30 || (data.links?.length ?? 0) > 10
      || data.links?.some(link => link.label.trim().length === 0 || link.label.length > 120) === true) {
      throw new Error('content-invalid');
    }
    Object.assign(result, {
      urlImg: data.urlImg, coverAlt: data.coverAlt?.trim() ?? '', thumbnailUrl: data.thumbnailUrl ?? '', urlRepo: data.urlRepo ?? '', urlPlay: data.urlPlay ?? '',
      gallery: data.gallery ?? [], links: data.links ?? [], technologyIds: data.technologyIds ?? [],
      galleryItems,
    });
  } else {
    if ((data.category !== 'language' && data.category !== 'tech')
      || !iconKeys.includes(data.iconKey as typeof iconKeys[number]) || !/^#[\da-f]{6}$/i.test(data.color ?? '')
      || !Number.isSafeInteger(data.sortOrder) || (data.sortOrder ?? -1) < 0 || (data.sortOrder ?? 0) > 9999
      || typeof data.published !== 'boolean') throw new Error('content-invalid');
    Object.assign(result, {
      category: data.category, iconKey: data.iconKey, color: data.color,
      sortOrder: data.sortOrder, published: data.published,
    });
  }
  return result;
}

export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(item => canonical(item)).join(',')}]`;
  if (typeof value === 'object' && value !== null) {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${canonical(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

export function contentFingerprint(kind: ContentKind, data: Record<string, unknown>): string {
  const keys = kind === 'projects' ? ['name', 'description', 'urlImg', 'urlRepo', 'urlPlay', 'gallery', 'links',
    'technologyIds', 'translations', 'galleryItems', 'coverAlt', 'thumbnailUrl'] : ['name', 'description', 'category', 'iconKey', 'color', 'sortOrder',
    'published', 'translations'];
  return canonical(Object.fromEntries(keys.map(key => [key, data[key]])));
}

export function validImage(file: File): boolean {
  return file.size > 0 && file.size <= 10 * 1024 * 1024
    && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
}
