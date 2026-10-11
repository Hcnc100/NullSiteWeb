import type { Locale } from '../i18n/translations';

export interface ResumeEntry {
  storagePath: string; fileName: string; sizeBytes: number; enabled: boolean; updatedAt?: unknown;
}
export type ResumeSettings = Partial<Record<Locale, ResumeEntry>>;

export function validResumeForLocale(entry: ResumeEntry | undefined, locale: Locale): entry is ResumeEntry {
  return entry?.enabled === true && typeof entry.storagePath === 'string'
    && new RegExp(`^resumes/${locale}/[\\w-]+\\.pdf$`).test(entry.storagePath)
    && Number.isSafeInteger(entry.sizeBytes) && entry.sizeBytes > 0 && entry.sizeBytes <= 10 * 1024 * 1024;
}

export function chooseResume(settings: ResumeSettings | undefined, locale: Locale): ResumeEntry | undefined {
  if (validResumeForLocale(settings?.[locale], locale)) return settings[locale];
  const fallbackLocale = locale === 'es' ? 'en' : 'es';
  const fallback = settings?.[fallbackLocale];
  return validResumeForLocale(fallback, fallbackLocale) ? fallback : undefined;
}

export async function validPdf(file: File): Promise<boolean> {
  if (file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name)
    || file.size <= 5 || file.size > 10 * 1024 * 1024) return false;
  return new TextDecoder().decode(await file.slice(0, 5).arrayBuffer()) === '%PDF-';
}
