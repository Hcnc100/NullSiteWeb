import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { deleteObject, ref, uploadBytesResumable } from 'firebase/storage';
import { AdminAuthService } from '../auth/admin-auth.service';
import type { Locale } from '../../i18n/translations';
import { validPdf } from '../../models/resume';
import type { ResumeSettings } from '../../models/resume';
import { canonical } from '../../models/managed-content';

@Injectable({ providedIn: 'root' })
export class AdminResumeService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly auth = inject(AdminAuthService);
  private readonly settingsRef = doc(this.firestore, 'siteSettings', 'public');

  public async load(): Promise<ResumeSettings> {
    this.requireAdmin();
    const snapshot = await getDocFromServer(this.settingsRef);
    this.requireAdmin();
    return (snapshot.data()?.['resume'] ?? {}) as ResumeSettings;
  }

  public async publish(locale: Locale, file: File, baseline: ResumeSettings,
    progress: (percent: number) => void): Promise<void> {
    this.requireAdmin();
    if (!await validPdf(file)) throw new Error('pdf-invalid');
    this.requireAdmin();
    const storagePath = `resumes/${locale}/${crypto.randomUUID()}.pdf`;
    const fileName = `CV-${locale}.pdf`;
    const target = ref(this.storage, storagePath);
    const task = uploadBytesResumable(target, file, { contentType: 'application/pdf',
      contentDisposition: `attachment; filename="${fileName}"` });
    await new Promise<void>((resolve, reject) => {
      task.on('state_changed', snapshot => progress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)),
        reject, () => resolve());
    });
    try {
      await runTransaction(this.firestore, async transaction => {
        const snapshot = await transaction.get(this.settingsRef);
        this.requireAdmin();
        const current = (snapshot.data()?.['resume'] ?? {}) as ResumeSettings;
        if (canonical(current[locale]) !== canonical(baseline[locale])) throw new Error('content-conflict');
        const entry = { storagePath, fileName, sizeBytes: file.size, updatedAt: serverTimestamp(), enabled: true };
        if (snapshot.exists()) transaction.update(this.settingsRef, { [`resume.${locale}`]: entry });
        else transaction.set(this.settingsRef, { resume: { [locale]: entry } });
      });
    } catch (error: unknown) {
      await deleteObject(target).catch(() => undefined);
      throw error;
    }
    // Rules revoke old paths as soon as the pointer changes. Cleanup failure does not roll back publication.
    const oldPath = baseline[locale]?.storagePath;
    if (oldPath !== undefined && oldPath.startsWith(`resumes/${locale}/`)) {
      await deleteObject(ref(this.storage, oldPath)).catch(() => undefined);
    }
  }

  public async withdraw(locale: Locale, baseline: ResumeSettings): Promise<void> {
    this.requireAdmin();
    await runTransaction(this.firestore, async transaction => {
      const snapshot = await transaction.get(this.settingsRef);
      this.requireAdmin();
      const current = (snapshot.data()?.['resume'] ?? {}) as ResumeSettings;
      if (canonical(current[locale]) !== canonical(baseline[locale])) throw new Error('content-conflict');
      if (snapshot.exists()) transaction.update(this.settingsRef, { [`resume.${locale}.enabled`]: false });
    });
  }

  private requireAdmin(): void { if (!this.auth.isAdmin()) throw new Error('unauthorized'); }
}
