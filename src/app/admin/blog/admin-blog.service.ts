import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { collection, doc, getDocsFromServer, runTransaction, serverTimestamp, setDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytesResumable, uploadBytes, getBlob } from 'firebase/storage';
import { AdminAuthService } from '../auth/admin-auth.service';
import { blogFingerprint, privateImagePath, sanitizeBlogHtml, validateDraft } from '../../models/blog-draft';
import type { BlogDraft } from '../../models/blog-draft';
import { validImage } from '../../models/managed-content';
import { postKey, publicSnapshot } from '../../models/blog-post';

@Injectable({ providedIn: 'root' })
export class AdminBlogService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly auth = inject(AdminAuthService);
  private readonly document = inject(DOCUMENT);
  private readonly drafts = collection(this.firestore, 'blog-drafts');
  public newId(): string { return doc(this.drafts).id; }
  public async list(): Promise<BlogDraft[]> {
    this.requireAdmin();
    const result = await getDocsFromServer(this.drafts);
    this.requireAdmin();
    return result.docs.map(item => ({ ...item.data(), id: item.id }) as BlogDraft);
  }
  public async save(data: BlogDraft, baseline: BlogDraft | null): Promise<void> {
    this.requireAdmin(); validateDraft(data);
    const contentHtml = sanitizeBlogHtml(data.contentHtml, data.id, this.document).html;
    if (contentHtml.trim().length === 0) throw new Error('blog-invalid');
    const target = doc(this.drafts, data.id);
    const slug = doc(this.firestore, 'blog-slugs', `${data.locale}-${data.slug}`);
    await runTransaction(this.firestore, async transaction => {
      const current = await transaction.get(target);
      const reserved = await transaction.get(slug);
      const oldKey = baseline === null ? null : `${baseline.locale}-${baseline.slug}`;
      const oldSlug = oldKey !== null && oldKey !== slug.id ? doc(this.firestore, 'blog-slugs', oldKey) : null;
      const oldReservation = oldSlug === null ? null : await transaction.get(oldSlug);
      this.requireAdmin();
      if (baseline === null ? current.exists() : !current.exists()
        || blogFingerprint(current.data() as BlogDraft) !== blogFingerprint(baseline)) throw new Error('blog-conflict');
      if (reserved.exists() && reserved.data()['draftId'] !== data.id) throw new Error('blog-slug-taken');
      if (oldSlug !== null && oldReservation?.data()?.['draftId'] === data.id) transaction.delete(oldSlug);
      transaction.set(slug, { draftId: data.id });
      const patch = { title: data.title.trim(), slug: data.slug, excerpt: data.excerpt.trim(), locale: data.locale,
        tags: data.tags, contentHtml, contentFormat: 'html', contentVersion: 1, status: 'draft',
        revision: (baseline?.revision ?? 0) + 1, updatedAt: serverTimestamp() };
      if (current.exists()) transaction.update(target, patch);
      else transaction.set(target, { ...patch, authorUid: this.auth.user()?.uid, createdAt: serverTimestamp() });
    });
  }
  public async remove(baseline: BlogDraft): Promise<void> {
    this.requireAdmin();
    await runTransaction(this.firestore, async transaction => {
      const target = doc(this.drafts, baseline.id);
      const slug = doc(this.firestore, 'blog-slugs', `${baseline.locale}-${baseline.slug}`);
      const current = await transaction.get(target);
      const reserved = await transaction.get(slug);
      const published = baseline.publicationKey !== undefined ? doc(this.firestore, 'blog-posts', baseline.publicationKey) : null;
      const publication = published === null ? null : await transaction.get(published);
      this.requireAdmin();
      if (!current.exists() || blogFingerprint(current.data() as BlogDraft) !== blogFingerprint(baseline)) {
        throw new Error('blog-conflict');
      }
      transaction.delete(target);
      if (published !== null && publication?.data()?.['draftId'] === baseline.id) transaction.delete(published);
      if (reserved.data()?.['draftId'] === baseline.id) transaction.delete(slug);
    });
    // Private image objects are retained; no destructive cross-reference cleanup.
  }
  public async upload(id: string, file: File, progress: (percent: number) => void): Promise<string> {
    this.requireAdmin();
    if (!validImage(file)) throw new Error('blog-image-invalid');
    const path = `blog-drafts/${id}/${crypto.randomUUID()}.${file.type.split('/')[1]}`;
    const task = uploadBytesResumable(ref(this.storage, path), file, { contentType: file.type });
    await new Promise<void>((resolve, reject) => task.on('state_changed',
      state => progress(Math.round(100 * state.bytesTransferred / state.totalBytes)), reject, () => resolve()));
    this.requireAdmin(); return path;
  }
  public async image(path: string, id: string): Promise<Blob> {
    this.requireAdmin();
    if (!privateImagePath(path, id)) throw new Error('blog-image-invalid');
    const blob = await getBlob(ref(this.storage, path), 10 * 1024 * 1024);
    this.requireAdmin(); return blob;
  }
  private requireAdmin(): void { if (!this.auth.isAdmin()) throw new Error('unauthorized'); }

  public async setEnabled(enabled: boolean): Promise<void> {
    this.requireAdmin();
    await setDoc(doc(this.firestore, 'siteSettings', 'public'), { blogEnabled: enabled }, { merge: true });
    this.requireAdmin();
  }

  public async publish(baseline: BlogDraft): Promise<void> {
    this.requireAdmin(); validateDraft(baseline);
    const key = postKey(baseline.locale, baseline.slug);
    const version = crypto.randomUUID();
    const template = this.document.createElement('template');
    template.innerHTML = sanitizeBlogHtml(baseline.contentHtml, baseline.id, this.document).html;
    const images = Array.from(template.content.querySelectorAll('img'));
    if (images.length > 20 || (images.length === 0 && (template.content.textContent?.trim() ?? '') === '')) throw new Error('blog-invalid');
    // Upload to a new immutable namespace first. Until the transaction commits, rules deny public access.
    const copies = new Map<string, string>();
    for (const image of images) {
      const path = image.getAttribute('src') ?? '';
      let destination = copies.get(path);
      if (destination === undefined) {
        const blob = await this.image(path, baseline.id);
        if (!validImage(new File([blob], 'image', { type: blob.type }))) throw new Error('blog-image-invalid');
        destination = `blog-public/${key}/${version}/${path.split('/').pop()}`;
        await uploadBytes(ref(this.storage, destination), blob,
          { contentType: blob.type, cacheControl: 'private, no-store, max-age=0' });
        this.requireAdmin(); copies.set(path, destination);
      }
      image.setAttribute('src', destination);
    }
    const target = doc(this.drafts, baseline.id);
    const published = doc(this.firestore, 'blog-posts', key);
    await runTransaction(this.firestore, async transaction => {
      const current = await transaction.get(target);
      const existing = await transaction.get(published);
      const previous = baseline.publicationKey !== undefined && baseline.publicationKey !== key
        ? doc(this.firestore, 'blog-posts', baseline.publicationKey) : null;
      const previousData = previous === null ? null : await transaction.get(previous);
      this.requireAdmin();
      if (!current.exists() || blogFingerprint(current.data() as BlogDraft) !== blogFingerprint(baseline)) {
        throw new Error('blog-conflict');
      }
      if (existing.exists() && existing.data()['draftId'] !== baseline.id) throw new Error('blog-slug-taken');
      if (previous !== null && previousData?.data()?.['draftId'] === baseline.id) transaction.delete(previous);
      transaction.set(published, { ...publicSnapshot(baseline, template.innerHTML, version, this.document),
        publishedAt: serverTimestamp() });
      transaction.update(target, { publicationKey: key, publishedRevision: baseline.revision });
    });
  }

  public async unpublish(baseline: BlogDraft): Promise<void> {
    this.requireAdmin();
    if (baseline.publicationKey === undefined) return;
    const target = doc(this.drafts, baseline.id);
    const published = doc(this.firestore, 'blog-posts', baseline.publicationKey);
    await runTransaction(this.firestore, async transaction => {
      const current = await transaction.get(target);
      const existing = await transaction.get(published);
      this.requireAdmin();
      if (!current.exists() || blogFingerprint(current.data() as BlogDraft) !== blogFingerprint(baseline)) {
        throw new Error('blog-conflict');
      }
      if (existing.data()?.['draftId'] === baseline.id) transaction.delete(published);
      transaction.update(target, { publicationKey: deleteField(), publishedRevision: deleteField() });
    });
  }
}
