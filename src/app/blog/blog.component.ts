import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { I18nService } from '../i18n/i18n.service';
import type { BlogPost } from '../models/blog-post';
import { sanitizePublishedHtml } from '../models/blog-draft';
import { PublicBlogService } from './public-blog.service';
import { SeoService } from './seo.service';
import { BlogThumbnailComponent } from './blog-thumbnail.component';

@Component({ selector: 'app-public-blog', standalone: true, imports: [RouterLink, BlogThumbnailComponent],
  templateUrl: './blog.component.html', styleUrls: ['./blog.component.scss', '../admin/blog/blog-body.scss'] })
export class BlogComponent {
  public readonly i18n = inject(I18nService);
  public readonly blog = inject(PublicBlogService);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly document = inject(DOCUMENT);
  private readonly seo = inject(SeoService);
  public readonly posts = signal<BlogPost[]>([]);
  public readonly post = signal<BlogPost | null>(null);
  public readonly rendered = signal('');
  public readonly loading = signal(true);
  public readonly failed = signal(false);
  public readonly imageError = signal(false);
  public readonly detail = signal(false);
  private generation = 0;
  private urls: string[] = [];
  public constructor() {
    effect(onCleanup => {
      const enabled = this.blog.enabled(); const ready = this.blog.ready();
      const slug = this.params().get('slug'); const locale = this.i18n.locale();
      const path = `/${locale}/blog${slug === null ? '' : '/' + encodeURIComponent(slug)}`;
      this.reset(); const generation = this.generation; this.detail.set(slug !== null);
      this.loading.set(!ready); this.failed.set(this.blog.error());
      const seo = (title: string, description: string, index: boolean, article = false): void =>
        this.seo.setPage({ path, title, description, index, article });
      seo('Blog', '', false);
      if (!enabled) return;
      this.loading.set(true);
      const fail = (): void => {
        if (generation !== this.generation) return;
        this.reset(); this.loading.set(false); this.failed.set(true); seo('Blog', '', false);
      };
      let stop: () => void;
      if (slug === null) {
        stop = this.blog.list(locale, posts => {
          if (generation !== this.generation) return;
          this.posts.set(posts);
          this.loading.set(false); this.failed.set(false);
          seo('Blog', this.text('Artículos sobre desarrollo y tecnología.', 'Articles about development and technology.'), true);
        }, fail);
      } else {
        try {
          stop = this.blog.post(locale, slug, post => {
            if (generation !== this.generation) return;
            this.post.set(post); this.loading.set(false); this.failed.set(false);
            this.revoke();
            this.rendered.set(''); this.imageError.set(false);
            if (post === null) { seo('Blog', '', false); return; }
            seo(post.title, post.excerpt, true, true);
            void this.render(post, generation);
          }, fail);
        } catch { fail(); return; }
      }
      onCleanup(() => { stop(); this.reset(); });
    });
    inject(DestroyRef).onDestroy(() => this.reset());
  }
  public text(es: string, en: string): string { return this.i18n.locale() === 'es' ? es : en; }
  private async render(post: BlogPost, generation: number): Promise<void> {
    const template = this.document.createElement('template');
    template.innerHTML = sanitizePublishedHtml(post.contentHtml, post.id, post.assetVersion, this.document);
    const images = Array.from(template.content.querySelectorAll('img'));
    const paths = images.map(image => image.getAttribute('src') ?? '');
    images.forEach(image => image.removeAttribute('src'));
    this.rendered.set(template.innerHTML);
    if (images.length > 20) { this.imageError.set(true); return; }
    for (let index = 0; index < images.length; index++) {
      try {
        const blob = await this.blog.image(paths[index], post.id, post.assetVersion);
        if (!this.valid(post, generation)) return;
        const url = URL.createObjectURL(blob); this.urls.push(url); images[index].setAttribute('src', url);
        images[index].setAttribute('loading', 'lazy'); images[index].setAttribute('decoding', 'async');
      } catch { if (this.valid(post, generation)) this.imageError.set(true); }
    }
    if (this.valid(post, generation)) this.rendered.set(template.innerHTML);
  }
  private valid(post: BlogPost, generation: number): boolean {
    return generation === this.generation && this.blog.enabled() && this.post() === post;
  }
  private revoke(): void { this.urls.forEach(url => URL.revokeObjectURL(url)); this.urls = []; }
  private reset(): void {
    this.generation++; this.revoke(); this.post.set(null); this.posts.set([]); this.rendered.set(''); this.imageError.set(false);
  }
}
