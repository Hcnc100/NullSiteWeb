import { DOCUMENT } from '@angular/common';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { collection, doc, getDocsFromServer, limit, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';
import { AdminAuthService } from '../auth/admin-auth.service';
import type { Terms } from '../../models/Terms';
import type { LegalDraft, LegalHistory, LegalRecord } from './legal-editor.model';
import { assertLegalSize, draftValue, legalContent, legalId, sameDraft, sameTerms, termsValue } from './legal-editor.model';

// Narrow transaction boundary: tests can verify atomic effects without contacting Firebase.
export const LEGAL_TRANSACTION = new InjectionToken<typeof runTransaction>('LEGAL_TRANSACTION', { providedIn: 'root', factory: () => runTransaction });

@Injectable({ providedIn: 'root' })
export class AdminLegalService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AdminAuthService);
  private readonly document = inject(DOCUMENT);
  private readonly transaction = inject(LEGAL_TRANSACTION);
  public newId(): string { this.requireAdmin(); return doc(collection(this.firestore, 'legal-drafts')).id; }
  private requireAdmin(): void { if (!this.auth.isAdmin()) throw new Error('unauthorized'); }
  public async list(): Promise<LegalRecord[]> {
    this.requireAdmin();
    const [published, drafts] = await Promise.all(['terms', 'legal-drafts'].map(path =>
      getDocsFromServer(collection(this.firestore, path))));
    this.requireAdmin();
    const records = new Map<string, LegalRecord>();
    for (const item of published.docs) {
      const value = termsValue(item.data());
      if (value === null) throw new Error('legal-invalid');
      records.set(item.id, { id: item.id, published: value, draft: null });
    }
    for (const item of drafts.docs) {
      const record = records.get(item.id) ?? { id: item.id, published: null, draft: null };
      record.draft = draftValue(item.id, item.data()); records.set(item.id, record);
    }
    return Array.from(records.values()).sort((a, b) =>
      (a.draft?.title ?? a.published?.title ?? '').localeCompare(b.draft?.title ?? b.published?.title ?? ''));
  }
  public async save(id: string, input: Terms, baseline: LegalDraft | null, base: Terms | null, rebase = false): Promise<LegalDraft> {
    this.requireAdmin();
    if (!legalId(id) || (baseline !== null && baseline.id !== id)) throw new Error('legal-invalid');
    const value = legalContent(input, this.document);
    const target = doc(this.firestore, 'legal-drafts', id);
    const next: LegalDraft = { id, ...value, revision: (baseline?.revision ?? 0) + 1,
      publishedRevision: baseline?.publishedRevision ?? 0, base: baseline?.base ?? base };
    // A null base belongs to a not-yet-published document; do not replace it with a later public value.
    if (baseline !== null && !rebase) next.base = baseline.base;
    if (rebase) next.base = base;
    assertLegalSize(next);
    await this.transaction(this.firestore, async transaction => {
      const current = await transaction.get(target);
      const published = await transaction.get(doc(this.firestore, 'terms', id));
      this.requireAdmin();
      if (published.exists() && termsValue(published.data()) === null) throw new Error('legal-invalid');
      if (!sameDraft(current.exists() ? draftValue(id, current.data()) : null, baseline)
        || ((baseline === null || rebase) && !sameTerms(published.exists() ? termsValue(published.data()) : null, base))) {
        throw new Error('legal-conflict');
      }
      const { id: ignored, ...data } = next; void ignored;
      transaction.set(target, { ...data, updatedAt: serverTimestamp() });
    });
    return next;
  }
  public async publish(baseline: LegalDraft): Promise<LegalDraft> {
    this.requireAdmin();
    if (!legalId(baseline.id)) throw new Error('legal-invalid');
    const value = legalContent(baseline, this.document);
    if (!sameTerms(value, baseline)) throw new Error('legal-normalize');
    const target = doc(this.firestore, 'legal-drafts', baseline.id);
    const published = doc(this.firestore, 'terms', baseline.id);
    const history = doc(collection(target, 'history'));
    const next = { ...baseline, base: value, publishedRevision: baseline.revision };
    assertLegalSize(next); assertLegalSize({ ...value, previous: baseline.base });
    await this.transaction(this.firestore, async transaction => {
      const current = await transaction.get(target);
      const existing = await transaction.get(published);
      this.requireAdmin();
      if (existing.exists() && termsValue(existing.data()) === null) throw new Error('legal-invalid');
      if (!sameDraft(current.exists() ? draftValue(baseline.id, current.data()) : null, baseline)
        || !sameTerms(existing.exists() ? termsValue(existing.data()) : null, baseline.base)) throw new Error('legal-conflict');
      if (baseline.publishedRevision === baseline.revision) throw new Error('legal-already-published');
      // Preserve extra legacy/mobile metadata. Only title/content are edited by this portal.
      transaction.set(published, value, { merge: true });
      transaction.set(history, { ...value, previous: baseline.base, revision: baseline.revision, publishedAt: serverTimestamp() });
      transaction.update(target, { base: value, publishedRevision: baseline.revision, updatedAt: serverTimestamp() });
    });
    return next;
  }
  public async history(id: string): Promise<LegalHistory[]> {
    this.requireAdmin(); if (!legalId(id)) throw new Error('legal-invalid');
    const result = await getDocsFromServer(query(collection(this.firestore, 'legal-drafts', id, 'history'),
      orderBy('publishedAt', 'desc'), limit(20)));
    this.requireAdmin();
    return result.docs.map(item => ({ id: item.id, ...item.data() }) as LegalHistory);
  }
}
