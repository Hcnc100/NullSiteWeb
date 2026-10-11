import { FormControl } from '@angular/forms';
import {
  editableProfile, httpsUrlValidator, nonBlankValidator, profileFingerprint, profileUpdate, readSocialLinks,
} from './profile-editor.model';
import type { EditableProfile } from './profile-editor.model';

describe('Profile editing contract', () => {
  const profile: EditableProfile = {
    name: 'Ricardo', profession: 'Developer', description: 'About me', urlImg: 'https://example.com/photo.webp',
    socialLinks: [{ platform: 'github', url: 'https://github.com/example' }],
  };

  it('accepts optional blank social links and HTTPS URLs', () => {
    expect(httpsUrlValidator(new FormControl(''))).toBeNull();
    expect(httpsUrlValidator(new FormControl('https://example.com/path'))).toBeNull();
  });

  const unsafeUrls = [
    'javascript:alert(1)', 'http://example.com', 'data:text/html,x', '//example.com', 'https://user:pass@example.com',
  ];
  for (const url of unsafeUrls) {
    it(`rejects unsafe URL ${url}`, () => {
      expect(httpsUrlValidator(new FormControl(url))).toEqual({ httpsUrl: true });
    });
  }

  it('rejects whitespace-only required fields', () => {
    expect(nonBlankValidator(new FormControl('  '))).toEqual({ required: true });
  });

  it('preserves absence of socialLinks for existing mobile documents', () => {
    const old = editableProfile({ name: 'Ricardo', profession: 'Dev', description: 'Hi', urlImg: profile.urlImg });
    expect(old.socialLinks).toBeUndefined();
  });

  it('builds a partial update without counters or unknown mobile fields', () => {
    const update = profileUpdate({ ...profile, name: ' Ricardo ' });
    expect(update['name']).toBe('Ricardo');
    expect(Object.keys(update).sort()).toEqual(['description', 'name', 'profession', 'socialLinks', 'urlImg']);
  });

  it('does not report a conflict just because unrelated mobile counters change', () => {
    const one = editableProfile({ ...profile, countProjects: 4 });
    const two = editableProfile({ ...profile, countProjects: 5, extraMobileField: true });
    expect(profileFingerprint(one)).toBe(profileFingerprint(two));
  });

  it('detects edits made from another device without requiring a mobile revision field', () => {
    expect(profileFingerprint(profile)).not.toBe(profileFingerprint({ ...profile, name: 'Updated on mobile' }));
  });

  it('rejects invalid profile fields even if form validation was bypassed', () => {
    expect(() => profileUpdate({ ...profile, name: ' ' })).toThrowError(new Error("profile-invalid"));
    expect(() => profileUpdate({ ...profile, urlImg: 'javascript:alert(1)' })).toThrowError(new Error("profile-invalid"));
  });

  it('ignores malformed, unsafe or duplicate links from stored documents', () => {
    expect(readSocialLinks([
      null, { platform: 'toString', url: 'https://example.com' },
      { platform: 'github', url: 'javascript:alert(1)' },
      { platform: 'github', url: 'https://github.com/first' },
      { platform: 'github', url: 'https://github.com/duplicate' },
    ])).toEqual([{ platform: 'github', url: 'https://github.com/first' }]);
  });

  it('distinguishes removed links from a legacy document without the field', () => {
    expect(readSocialLinks([])).toEqual([]);
    expect(readSocialLinks(undefined)).toBeUndefined();
  });
});
