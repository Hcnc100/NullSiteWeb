import type { Locale, Translations } from '../i18n/translations';
import { localizedText } from '../i18n/translations';
import { isHttpsUrl } from './profile-editor.model';

export interface ProjectImage {
  url: string; alt: string; order: number; thumbnailUrl?: string; translations?: Translations;
}
export function imageAlt(base: string | undefined, translations: Translations | undefined, locale: Locale, fallback: string): string {
  return localizedText(base ?? '', translations, locale, 'alt').trim() || fallback;
}
export function thumbnailUrl(thumbnail: string | undefined, original: string): string {
  return thumbnail !== undefined && isHttpsUrl(thumbnail) && thumbnail.length <= 2048 ? thumbnail : isHttpsUrl(original) ? original : '';
}
export function missingTranslations(translations: Translations | undefined, fields: readonly string[]): string[] {
  return (['es', 'en'] as const).flatMap(locale => fields.filter(field => {
    const value: unknown = translations?.[locale]?.[field];
    return typeof value !== 'string' || value.trim() === '';
  }).map(field => `${locale} · ${field}`));
}
