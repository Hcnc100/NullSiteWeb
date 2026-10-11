import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { collection, doc, getDocsFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { AdminAuthService } from '../auth/admin-auth.service';
import { contentFingerprint, contentPatch, defaultSkills, validImage } from '../../models/managed-content';
import type { ContentKind, ManagedContent } from '../../models/managed-content';

@Injectable({ providedIn: 'root' })
export class AdminContentService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly auth = inject(AdminAuthService);

  public newId(kind: ContentKind): string { return doc(this.reference(kind)).id; }

  public async list(kind: ContentKind): Promise<ManagedContent[]> {
    this.requireAdmin();
    const result = await getDocsFromServer(this.reference(kind));
    this.requireAdmin();
    return result.docs.map(item => ({ ...item.data(), id: item.id }) as ManagedContent);
  }

  public async save(kind: ContentKind, data: ManagedContent, baseline: ManagedContent | null): Promise<void> {
    this.requireAdmin();
    const patch = contentPatch(kind, data);
    const target = doc(this.reference(kind), data.id);
    await runTransaction(this.firestore, async transaction => {
      const snapshot = await transaction.get(target);
      if (kind === 'skills') {
        const settings = await transaction.get(doc(this.firestore, 'siteSettings', 'public'));
        if (settings.data()?.['skillsManaged'] !== true) throw new Error('skills-import-required');
      }
      this.requireAdmin();
      if (baseline === null) {
        if (snapshot.exists()) throw new Error('content-conflict');
        // Dotted paths are update syntax, not keys in a newly created document.
        const create = { ...patch };
        for (const key of Object.keys(create)) if (key.startsWith('translations.')) delete create[key];
        transaction.set(target, { ...create, translations: data.translations ?? {}, id: data.id,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      } else {
        if (!snapshot.exists() || contentFingerprint(kind, snapshot.data()) !== contentFingerprint(kind, baseline)) {
          throw new Error('content-conflict');
        }
        transaction.update(target, { ...patch, updatedAt: serverTimestamp() });
      }
    });
  }

  public async remove(kind: ContentKind, baseline: ManagedContent): Promise<void> {
    this.requireAdmin();
    await runTransaction(this.firestore, async transaction => {
      const target = doc(this.reference(kind), baseline.id);
      const current = await transaction.get(target);
      this.requireAdmin();
      if (!current.exists() || contentFingerprint(kind, current.data()) !== contentFingerprint(kind, baseline)) {
        throw new Error('content-conflict');
      }
      transaction.delete(target);
    });
    // Do not delete referenced Storage objects: mobile/other projects may still use them.
  }

  public async importSkills(): Promise<void> {
    this.requireAdmin();
    await runTransaction(this.firestore, async transaction => {
      const targets = defaultSkills.map(skill => doc(this.reference('skills'), skill.id));
      const existing = await Promise.all(targets.map(target => transaction.get(target)));
      this.requireAdmin();
      defaultSkills.forEach((skill, index) => {
        if (!existing[index].exists()) transaction.set(targets[index], {
          ...skill, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
      });
      transaction.set(doc(this.firestore, 'siteSettings', 'public'), { skillsManaged: true }, { merge: true });
    });
  }

  public async uploadImage(id: string, file: File, progress: (percent: number) => void): Promise<string> {
    this.requireAdmin();
    if (!validImage(file)) throw new Error('image-invalid');
    const extension = file.type.split('/')[1];
    const target = ref(this.storage, `projects/${id}/${crypto.randomUUID()}.${extension}`);
    const task = uploadBytesResumable(target, file, { contentType: file.type });
    await new Promise<void>((resolve, reject) => {
      task.on('state_changed', snapshot => progress(Math.round(100 * snapshot.bytesTransferred / snapshot.totalBytes)),
        reject, () => resolve());
    });
    this.requireAdmin();
    return getDownloadURL(target);
  }

  private reference(kind: ContentKind): ReturnType<typeof collection> {
    return collection(this.firestore, kind === 'projects' ? 'last-projects' : 'skills');
  }

  private requireAdmin(): void { if (!this.auth.isAdmin()) throw new Error('unauthorized'); }
}
