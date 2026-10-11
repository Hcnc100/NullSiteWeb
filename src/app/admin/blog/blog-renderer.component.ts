import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { AdminBlogService } from './admin-blog.service';
import { AdminAuthService } from '../auth/admin-auth.service';
import { sanitizeBlogHtml } from '../../models/blog-draft';
import { RichColorsDirective } from '../../models/rich-colors.directive';

@Component({ selector: 'app-blog-renderer', standalone: true, imports: [RichColorsDirective],
  template: `@if (error()) { <p role="alert">{{error()}}</p> }<article class="blog-body" [innerHTML]="rendered()" [appRichColors]="rendered()"></article>`,
  styleUrl: './blog-body.scss' })
export class BlogRendererComponent {
  public readonly html = input.required<string>();
  public readonly draftId = input.required<string>();
  public readonly imageLoader = input<((path: string) => Promise<Blob>) | undefined>(undefined);
  public readonly rendered = signal('');
  public readonly error = signal('');
  private readonly service = inject(AdminBlogService);
  private readonly auth = inject(AdminAuthService);
  private readonly document = inject(DOCUMENT);
  private generation = 0;
  private urls: string[] = [];
  public constructor() {
    effect(() => {
      const html = this.html(); const id = this.draftId();
      this.reset();
      if (this.auth.isAdmin()) void this.render(html, id, this.generation);
    });
    inject(DestroyRef).onDestroy(() => this.reset());
  }
  private async render(html: string, id: string, generation: number): Promise<void> {
    const template = this.document.createElement('template');
    template.innerHTML = sanitizeBlogHtml(html, id, this.document).html;
    const images = Array.from(template.content.querySelectorAll('img'));
    if (images.length > 20) { this.error.set('Máximo 20 imágenes en la vista previa.'); return; }
    for (const image of images) {
      const path = image.getAttribute('src') ?? '';
      image.removeAttribute('src');
      try {
        const loader = this.imageLoader();
        const blob = loader ? await loader(path) : await this.service.image(path, id);
        if (generation !== this.generation || !this.auth.isAdmin()) return;
        const url = URL.createObjectURL(blob); this.urls.push(url); image.setAttribute('src', url);
      } catch {
        if (generation !== this.generation) return;
        this.error.set('No se pudieron cargar imágenes privadas. Revisa conexión, permisos y CORS.');
      }
    }
    if (generation === this.generation && this.auth.isAdmin()) this.rendered.set(template.innerHTML);
  }
  private reset(): void {
    this.generation++; this.urls.forEach(url => URL.revokeObjectURL(url)); this.urls = [];
    this.rendered.set(''); this.error.set('');
  }
}
