
import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { DocumentReference, Transaction } from 'firebase/firestore';
import { AdminAuthService } from '../auth/admin-auth.service';
import { AdminLegalService, LEGAL_TRANSACTION } from './admin-legal.service';
import type { LegalDraft } from './legal-editor.model';

describe('Legal transactional persistence (no network)', () => {
  const app = initializeApp({ projectId: 'demo-nullsite-legal-tests', apiKey: 'fake' }, 'legal-tests');
  const db = getFirestore(app);
  const original = { title: 'Original', content: '<p>Original policy</p>' };
  let data: Map<string, Record<string, unknown>>;
  let service: AdminLegalService;
  let admin: boolean;
  let writes: number;
  beforeEach(() => {
    admin = true; writes = 0; data = new Map([['terms/existing', { ...original, mobileMetadata: 'preserved' }]]);
    TestBed.configureTestingModule({ providers: [
      { provide: Firestore, useValue: db },
      { provide: AdminAuthService, useValue: { isAdmin: () => admin } },
      { provide: LEGAL_TRANSACTION, useValue: async (_db: unknown, action: (transaction: Transaction) => Promise<void>) => {
        const staged: (() => void)[] = [];
        const transaction = {
          get: async (ref: DocumentReference) => ({ exists: () => data.has(ref.path), data: () => data.get(ref.path) }),
          set: (ref: DocumentReference, value: Record<string, unknown>, options?: { merge: boolean }) => {
            staged.push(() => data.set(ref.path, options?.merge === true ? { ...data.get(ref.path), ...value } : value));
          },
          update: (ref: DocumentReference, value: Record<string, unknown>) => {
            staged.push(() => data.set(ref.path, { ...data.get(ref.path), ...value }));
          },
        } as unknown as Transaction;
        await action(transaction); writes += staged.length; staged.forEach(commit => commit());
      } },
    ] }); service = TestBed.inject(AdminLegalService);
  });
  afterAll(async () => { await deleteApp(app); });
  it('saves sanitized private data without touching the public document', async () => {
    const draft = await service.save('existing', { title: 'Next', content: '<p onclick="x()">Safe</p>' }, null, original);
    expect(draft.content).toBe('<p>Safe</p>'); expect(draft.revision).toBe(1);
    expect(data.get('terms/existing')).toEqual({ ...original, mobileMetadata: 'preserved' });
    expect(writes).toBe(1);
  });
  it('publishes saved content, archives the previous public body and preserves mobile metadata atomically', async () => {
    const draft = await service.save('existing', { title: 'Next', content: '<p>Next</p>' }, null, original);
    const next = await service.publish(draft);
    expect(data.get('terms/existing')).toEqual({ title: 'Next', content: '<p>Next</p>', mobileMetadata: 'preserved' });
    const history = Array.from(data.entries()).find(([path]) => path.includes('/history/'))?.[1];
    expect(history?.['previous']).toEqual(original); expect(next.publishedRevision).toBe(1);
    expect(writes).toBe(4);
  });
  it('keeps new drafts private until a distinct publication', async () => {
    const draft = await service.save('new', { title: 'New', content: '<p>New</p>' }, null, null);
    expect(data.has('terms/new')).toBe(false); await service.publish(draft);
    expect(data.has('terms/new')).toBe(true);
  });
  it('rejects stale mobile public content with no partial publication', async () => {
    const draft = await service.save('existing', original, null, original);
    data.set('terms/existing', { title: 'Mobile', content: '<p>Changed elsewhere</p>' });
    await expect(service.publish(draft)).rejects.toThrowError(new Error("legal-conflict"));
    expect(writes).toBe(1); expect(Array.from(data.keys()).some(path => path.includes('/history/'))).toBe(false);
  });
  it('rejects stale draft saves and publication after another save', async () => {
    const first = await service.save('existing', original, null, original);
    await service.save('existing', { ...original, title: 'Other editor' }, first, original);
    await expect(service.save('existing', original, first, original)).rejects.toThrowError(new Error("legal-conflict"));
    await expect(service.publish(first)).rejects.toThrowError(new Error("legal-conflict"));
  });
  it('requires explicit rebase after a mobile edit and verifies that public baseline again', async () => {
    const first = await service.save('existing', original, null, original);
    const mobile = { title: 'Mobile', content: '<p>Mobile</p>' }; data.set('terms/existing', mobile);
    const next = await service.save('existing', mobile, first, mobile, true);
    expect(next.base).toEqual(mobile); await service.publish(next);
    expect(data.get('terms/existing')?.['title']).toBe('Mobile');
  });
  it('never silently adopts a newly created public document when the original base was null', async () => {
    const first = await service.save('new', original, null, null);
    data.set('terms/new', original);
    const next = await service.save('new', original, first, original);
    expect(next.base).toBeNull(); await expect(service.publish(next)).rejects.toThrowError(new Error("legal-conflict"));
  });
  it('rejects unauthorized, invalid, duplicate and unnormalized publications', async () => {
    admin = false; await expect(service.save('new', original, null, null)).rejects.toThrowError(new Error("unauthorized"));
    admin = true; await expect(service.save('../bad', original, null, null)).rejects.toThrowError(new Error("legal-invalid"));
    const first = await service.save('new', original, null, null); const published = await service.publish(first);
    await expect(service.publish(published)).rejects.toThrowError(new Error("legal-already-published"));
    await expect(service.publish({ ...first, content: '<p onclick="evil()">Test</p>' } as LegalDraft)).rejects.toThrowError(new Error("legal-normalize"));
  });
});
