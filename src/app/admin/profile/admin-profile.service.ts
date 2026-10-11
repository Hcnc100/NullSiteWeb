import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { AdminAuthService } from '../auth/admin-auth.service';
import { editableProfile, profileFingerprint, profileUpdate } from '../../models/profile-editor.model';
import type { EditableProfile } from '../../models/profile-editor.model';

@Injectable({ providedIn: 'root' })
export class AdminProfileService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AdminAuthService);
  private readonly profileRef = doc(this.firestore, 'infoProfile', 'nullPointer');

  public async load(): Promise<EditableProfile> {
    this.requireAdmin();
    const snapshot = await getDocFromServer(this.profileRef);
    this.requireAdmin();
    if (!snapshot.exists()) throw new Error('profile-missing');
    return editableProfile(snapshot.data());
  }

  public async save(profile: EditableProfile, baseline: EditableProfile): Promise<void> {
    this.requireAdmin();
    const update = profileUpdate(profile);
    const translations: Record<string, string> = {};
    if (profile.translations !== undefined) {
      for (const locale of ['es', 'en'] as const) for (const field of ['profession', 'description']) {
        const value = profile.translations[locale]?.[field] ?? '';
        if (typeof value !== 'string' || value.length > (field === 'profession' ? 180 : 5000)) throw new Error('profile-invalid');
        translations[`translations.${locale}.${field}`] = value.trim();
      }
    }
    await runTransaction(this.firestore, async transaction => {
      this.requireAdmin();
      const snapshot = await transaction.get(this.profileRef);
      if (!snapshot.exists()) throw new Error('profile-missing');
      if (profileFingerprint(editableProfile(snapshot.data())) !== profileFingerprint(baseline)) {
        throw new Error('profile-conflict');
      }
      this.requireAdmin();
      // Never replace the document: preserve mobile fields, counters and createdAt.
      transaction.update(this.profileRef, { ...update, ...translations, updatedAt: serverTimestamp() });
    });
  }

  private requireAdmin(): void {
    if (!this.auth.isAdmin()) throw new Error('profile-unauthorized');
  }
}
