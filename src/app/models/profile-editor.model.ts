import type { AbstractControl, ValidationErrors } from '@angular/forms';
import type { Translations } from '../i18n/translations';

export const socialPlatforms = ['github', 'facebook', 'instagram', 'twitter', 'whatsapp'] as const;
export type SocialPlatform = typeof socialPlatforms[number];
export interface ProfileSocialLink { readonly platform: SocialPlatform; readonly url: string; }
export interface EditableProfile {
  readonly name: string;
  readonly profession: string;
  readonly description: string;
  readonly urlImg: string;
  readonly socialLinks?: readonly ProfileSocialLink[];
  readonly translations?: Translations;
}

export const defaultSocialLinks: readonly ProfileSocialLink[] = [
  { platform: 'github', url: 'https://github.com/Hcnc100' },
  { platform: 'facebook', url: 'https://www.facebook.com/ricardo.pajarocoatl/' },
  { platform: 'instagram', url: 'https://www.instagram.com/ricardopajarocoatl1/' },
  { platform: 'twitter', url: 'https://twitter.com/Ricardo_hcnc' },
  { platform: 'whatsapp', url: 'https://wa.me/522221707686' },
];

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.length > 0 && url.username === '' && url.password === '';
  } catch { return false; }
}

export function httpsUrlValidator(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return value === '' || (typeof value === 'string' && isHttpsUrl(value)) ? null : { httpsUrl: true };
}

export function nonBlankValidator(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return typeof value === 'string' && value.trim().length > 0 ? null : { required: true };
}

export function readSocialLinks(value: unknown): ProfileSocialLink[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const links: ProfileSocialLink[] = [];
  for (const item of value as unknown[]) {
    if (typeof item !== 'object' || item === null) continue;
    const data = item as Record<string, unknown>;
    const platform = data['platform'];
    const url = data['url'];
    if (typeof platform !== 'string' || typeof url !== 'string'
      || !socialPlatforms.includes(platform as SocialPlatform) || !isHttpsUrl(url)
      || links.some(link => link.platform === platform)) continue;
    links.push({ platform: platform as SocialPlatform, url });
  }
  return links;
}

export function editableProfile(data: Record<string, unknown>): EditableProfile {
  const text = (key: string): string => typeof data[key] === 'string' ? data[key] : '';
  const links = readSocialLinks(data['socialLinks']);
  return {
    name: text('name'), profession: text('profession'), description: text('description'), urlImg: text('urlImg'),
    // Preserve absence: the public site uses existing links until the first explicit save.
    ...(links === undefined ? {} : { socialLinks: links }),
    ...(data['translations'] === undefined ? {} : { translations: data['translations'] as Translations }),
  };
}

export function profileFingerprint(profile: EditableProfile): string {
  return JSON.stringify([profile.name, profile.profession, profile.description, profile.urlImg, profile.socialLinks,
    ...(['es', 'en'] as const).flatMap(locale => ['profession', 'description'].map(field => profile.translations?.[locale]?.[field] ?? ''))]);
}

export function validateProfile(profile: EditableProfile): void {
  const fields: [string, number][] = [
    [profile.name, 120], [profile.profession, 180], [profile.description, 5000],
  ];
  if (fields.some(([value, max]) => value.trim().length === 0 || value.length > max)
    || profile.urlImg.length > 2048 || !isHttpsUrl(profile.urlImg)
    || (profile.socialLinks?.length ?? 0) > socialPlatforms.length
    || profile.socialLinks?.some(link => !socialPlatforms.includes(link.platform)
      || link.url.length > 2048 || !isHttpsUrl(link.url)) === true) {
    throw new Error('profile-invalid');
  }
}

export function profileUpdate(profile: EditableProfile): EditableProfile & { socialLinks: readonly ProfileSocialLink[] } {
  validateProfile(profile);
  return {
    name: profile.name.trim(), profession: profile.profession.trim(), description: profile.description.trim(),
    urlImg: profile.urlImg.trim(), socialLinks: profile.socialLinks ?? [],
  };
}
