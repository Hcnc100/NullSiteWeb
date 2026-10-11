import type { Translations } from '../i18n/translations';
import type { ProjectImage } from './project-media';

export interface Project {
  readonly translations?: Translations;
  readonly createdAt?: unknown;
  readonly technologyIds?: string[];
  readonly links?: { label: string; url: string }[];
  readonly galleryItems?: ProjectImage[];
  readonly coverAlt?: string;
  readonly thumbnailUrl?: string;
  readonly urlImg: string;
  readonly description: string;
  readonly id: string;
  readonly name: string;
  readonly urlRepo: string;
  readonly urlPlay: string;
  readonly gallery: string[];
  readonly published?: boolean;
  readonly sortOrder?: number;
  readonly updatedAt?: unknown;
}
