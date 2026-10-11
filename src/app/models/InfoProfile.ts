import type { ProfileSocialLink } from './profile-editor.model';
import type { Translations } from '../i18n/translations';

export interface InfoProfile {
  readonly translations?: Translations;
  readonly name: string;
  readonly profession: string;
  readonly description: string;
  readonly urlImg: string;
  readonly countProjects: number;
  readonly countCertificates: number;
  readonly socialLinks?: readonly ProfileSocialLink[];
}
