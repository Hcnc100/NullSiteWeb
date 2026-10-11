import { computed, inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, query, where } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { faAndroid, faAngular, faDocker, faGit, faGithub, faJava, faJsSquare, faPython } from '@fortawesome/free-brands-svg-icons';
import { defaultSkills } from '../models/managed-content';
import type { ManagedContent } from '../models/managed-content';
import type { ItemSkill } from '../models/ItemSkill';
import { I18nService } from '../i18n/i18n.service';
import { localizedText } from '../i18n/translations';

@Injectable({ providedIn: 'root' })
export class SkillsService {
  private readonly firestore = inject(Firestore);
  private readonly i18n = inject(I18nService);
  private readonly remote = toSignal(collectionData(query(collection(this.firestore, 'skills'),
    where('published', '==', true)), { idField: 'id' }).pipe(catchError(() => of(undefined))));
  private readonly settings = toSignal(docData(doc(this.firestore, 'siteSettings', 'public'))
    .pipe(catchError(() => of(undefined))));
  public readonly items = computed(() => {
    const records = this.settings()?.['skillsManaged'] === true ? (this.remote() ?? []) : defaultSkills;
    const icons = { android: faAndroid, angular: faAngular, docker: faDocker, git: faGit,
      github: faGithub, java: faJava, javascript: faJsSquare, python: faPython };
    return (records as ManagedContent[]).filter(skill => Object.prototype.hasOwnProperty.call(icons, skill.iconKey ?? '')
      && /^#[\da-f]{6}$/i.test(skill.color ?? '')).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(skill => ({ category: skill.category, item: {
        name: localizedText(skill.name, skill.translations, this.i18n.locale(), 'name'),
        icon: icons[skill.iconKey as keyof typeof icons], color: skill.color ?? '#78C257',
      } satisfies ItemSkill }));
  });
}
