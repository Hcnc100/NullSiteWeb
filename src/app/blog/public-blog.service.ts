import { DestroyRef, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { getBlob, ref } from 'firebase/storage';
import type { Locale } from '../i18n/translations';
import type { BlogPost } from '../models/blog-post';
import { postKey } from '../models/blog-post';
import { publicImagePath } from '../models/blog-draft';

export interface PublicBlogApi {
  settings: (next: (enabled: boolean, authoritative?: boolean) => void, error: () => void) => () => void;
  list: (locale: Locale, next: (posts: BlogPost[]) => void, error: () => void) => () => void;
  post: (key: string, next: (post: BlogPost | null) => void, error: () => void) => () => void;
  image: (path: string) => Promise<Blob>;
}

export const PUBLIC_BLOG_API = new InjectionToken<PublicBlogApi>('PUBLIC_BLOG_API', {
  providedIn: 'root', factory: () => {
    const firestore = inject(Firestore); const storage = inject(Storage);
    return {
      settings: (next, error) => onSnapshot(doc(firestore, 'siteSettings', 'public'), { includeMetadataChanges: true },
        snapshot => next(!snapshot.metadata.fromCache && snapshot.data()?.['blogEnabled'] === true, !snapshot.metadata.fromCache), error),
      list: (locale, next, error) => onSnapshot(query(collection(firestore, 'blog-posts'),
        where('locale', '==', locale), where('status', '==', 'published'), orderBy('publishedAt', 'desc'), limit(50)),
      { includeMetadataChanges: true },
      snapshot => { if (!snapshot.metadata.fromCache) next(snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as BlogPost)); }, error),
      post: (key, next, error) => onSnapshot(doc(firestore, 'blog-posts', key), { includeMetadataChanges: true },
        snapshot => { if (!snapshot.metadata.fromCache) next(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as BlogPost : null); }, error),
      image: path => getBlob(ref(storage, path), 10 * 1024 * 1024),
    };
  },
});

@Injectable({ providedIn: 'root' })
export class PublicBlogService {
  private readonly api = inject(PUBLIC_BLOG_API);
  public readonly enabled = signal(false);
  public readonly ready = signal(false);
  public readonly error = signal(false);
  public constructor() {
    const stop = this.api.settings((enabled, authoritative = true) => {
      this.enabled.set(enabled && authoritative); this.ready.set(authoritative); this.error.set(false);
    },
      () => { this.enabled.set(false); this.ready.set(true); this.error.set(true); });
    inject(DestroyRef).onDestroy(stop);
  }
  public list(locale: Locale, next: (posts: BlogPost[]) => void, error: () => void): () => void {
    if (!this.enabled()) { next([]); return () => undefined; }
    return this.api.list(locale, posts => next(this.enabled() ? posts : []), error);
  }
  public post(locale: Locale, slug: string, next: (post: BlogPost | null) => void, error: () => void): () => void {
    if (!this.enabled()) { next(null); return () => undefined; }
    return this.api.post(postKey(locale, slug), post => next(this.enabled() ? post : null), error);
  }
  public async image(path: string, key: string, version: string): Promise<Blob> {
    if (!this.enabled() || !publicImagePath(path, key, version)) throw new Error('blog-unavailable');
    const blob = await this.api.image(path);
    if (!this.enabled()) throw new Error('blog-unavailable');
    return blob;
  }
}
