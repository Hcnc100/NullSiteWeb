import { DOCUMENT } from '@angular/common';
import { Component, effect, ElementRef, inject, input, signal } from '@angular/core';
import type { BlogPost } from '../models/blog-post';
import { sanitizePublishedHtml } from '../models/blog-draft';
import { PublicBlogService } from './public-blog.service';

/** First published body image, loaded only near the viewport. Never resolve private paths or token URLs. */
@Component({ selector: 'app-blog-thumbnail', standalone: true,
  template: `@if (present()) { <div class="thumbnail-frame">@if (url(); as source) { <img [src]="source" [alt]="alt()" width="640" height="360" loading="lazy" decoding="async" (error)="failed()"> }</div> }`,
  styles: [`:host{display:block;min-width:0}.thumbnail-frame{aspect-ratio:16/9;margin-bottom:20px}img{display:block;width:100%;height:100%;object-fit:contain;border-radius:8px}`],
})
export class BlogThumbnailComponent {
  public readonly post = input.required<BlogPost>();
  public readonly url = signal('');
  public readonly alt = signal('');
  public readonly present = signal(false);
  private readonly document = inject(DOCUMENT);
  private readonly blog = inject(PublicBlogService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  public constructor() {
    effect(onCleanup => {
      const post = this.post(); const enabled = this.blog.enabled();
      this.url.set(''); this.alt.set(''); this.present.set(false);
      let active = true; let started = false; let objectUrl = '';
      const observer: { current?: IntersectionObserver } = {};
      onCleanup(() => { active = false; observer.current?.disconnect(); if (objectUrl !== '') URL.revokeObjectURL(objectUrl); });
      if (!enabled) return;
      const template = this.document.createElement('template');
      template.innerHTML = sanitizePublishedHtml(post.contentHtml, post.id, post.assetVersion, this.document);
      const image = template.content.querySelector('img'); const path = image?.getAttribute('src');
      if (path === null || path === undefined) return;
      this.present.set(true);
      const load = async (): Promise<void> => {
        if (started || !active) return; started = true;
        try {
          const blob = await this.blog.image(path, post.id, post.assetVersion);
          if (!active || !this.blog.enabled() || blob.size === 0 || blob.size > 10 * 1024 * 1024
            || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(blob.type)) {
            if (active) this.present.set(false); return;
          }
          objectUrl = URL.createObjectURL(blob); this.alt.set(image?.getAttribute('alt') ?? ''); this.url.set(objectUrl);
        } catch { if (active) this.present.set(false); /* Never hide article text when media fails. */ }
      };
      if (typeof IntersectionObserver === 'undefined') { void load(); return; }
      observer.current = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { observer.current?.disconnect(); void load(); }
      }, { rootMargin: '160px' });
      observer.current.observe(this.host.nativeElement);
    });
  }
  public failed(): void { this.url.set(''); this.present.set(false); }
}
