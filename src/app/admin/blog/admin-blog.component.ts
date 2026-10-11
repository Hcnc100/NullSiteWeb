import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, effect, HostListener, inject, signal, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminAuthService } from '../auth/admin-auth.service';
import { AdminBlogService } from './admin-blog.service';
import { BlogRendererComponent } from './blog-renderer.component';
import { FormatToolbarComponent } from '../format-toolbar.component';
import { sanitizeBlogHtml, validateDraft } from '../../models/blog-draft';
import type { BlogDraft } from '../../models/blog-draft';
import { I18nService } from '../../i18n/i18n.service';
import { isHttpsUrl } from '../../models/profile-editor.model';
import { PublicBlogService } from '../../blog/public-blog.service';

@Component({ selector: 'app-admin-blog', standalone: true,
  imports: [ReactiveFormsModule, BlogRendererComponent, FormatToolbarComponent], templateUrl: './admin-blog.component.html',
  styleUrls: ['../admin-ui.scss', './blog-editor.scss'] })
export class AdminBlogComponent {
  private readonly service = inject(AdminBlogService);
  private readonly auth = inject(AdminAuthService);
  private readonly document = inject(DOCUMENT);
  public readonly i18n = inject(I18nService);
  public readonly blog = inject(PublicBlogService);
  public readonly records = signal<BlogDraft[]>([]);
  public readonly activeId = signal<string | null>(null);
  public readonly isSaving = signal(false);
  public readonly loading = signal(false);
  public readonly mode = signal<'visual' | 'html' | 'preview'>('html');
  public readonly visualHtml = signal('');
  public readonly previewHtml = signal('');
  public readonly warning = signal(false);
  public readonly error = signal('');
  public readonly message = signal('');
  public readonly progress = signal<number | null>(null);
  public readonly formats = ['p', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'blockquote', 'pre'] as const;
  public readonly visual = viewChild<ElementRef<HTMLElement>>('visual');
  private baseline: BlogDraft | null = null;
  private generation = 0;
  public readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(180)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), Validators.maxLength(100)]],
    excerpt: ['', Validators.maxLength(500)], locale: ['es'], tags: ['', Validators.maxLength(820)],
    contentHtml: ['', [Validators.required, Validators.maxLength(200000)]],
  });
  public readonly linkUrl = inject(FormBuilder).nonNullable.control('');
  public readonly imageAlt = inject(FormBuilder).nonNullable.control('', Validators.maxLength(300));
  public constructor() {
    effect(() => { if (this.auth.access() !== 'loading' && !this.auth.isAdmin()) this.clear(); });
    inject(DestroyRef).onDestroy(() => this.clear());
    void this.load();
  }
  public text(es: string, en: string): string { return this.i18n.locale() === 'es' ? es : en; }
  public hasUnsavedChanges(): boolean { return this.activeId() !== null && this.form.dirty; }
  @HostListener('window:beforeunload', ['$event'])
  public beforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges() || this.isSaving()) { event.preventDefault(); event.returnValue = ''; }
  }
  public async load(): Promise<void> {
    if (this.isSaving() || !this.discard()) return;
    this.clear(); const generation = this.generation; this.loading.set(true);
    try {
      const records = await this.service.list();
      if (this.valid(generation)) this.records.set(records);
    } catch { if (this.valid(generation)) this.failed(); }
    finally { if (generation === this.generation) this.loading.set(false); }
  }
  public edit(record: BlogDraft | null): void {
    if (this.isSaving() || !this.auth.isAdmin() || !this.discard()) return;
    this.generation++; this.baseline = record; this.activeId.set(record?.id ?? this.service.newId());
    this.form.reset();
    if (record !== null) this.form.patchValue({ ...record, tags: record.tags.join(', ') });
    this.mode.set('visual'); this.visualHtml.set(this.visualMarkup(sanitizeBlogHtml(this.form.controls.contentHtml.value, this.activeId() ?? '', this.document).html)); this.previewHtml.set('');
    this.warning.set(false); this.error.set(''); this.message.set(''); this.form.markAsPristine();
  }
  public cancel(): void {
    if (this.isSaving() || !this.discard()) return;
    this.generation++; this.activeId.set(null); this.baseline = null; this.form.reset();
    this.visualHtml.set(''); this.previewHtml.set('');
  }
  public switchMode(mode: 'visual' | 'html' | 'preview'): void {
    if (this.isSaving() || this.activeId() === null) return;
    if (this.mode() === 'visual') this.captureVisual();
    const html = this.clean();
    this.mode.set(mode);
    if (mode === 'visual') this.visualHtml.set(this.visualMarkup(html));
    if (mode === 'preview') this.previewHtml.set(html);
  }
  public captureVisual(): void {
    if (this.isSaving() || !this.auth.isAdmin()) return;
    const element = this.visual()?.nativeElement;
    if (element === undefined) return;
    const template = this.document.createElement('template');
    // Visual input originated in our allowlisted editor; serialize image placeholders back to private paths.
    template.innerHTML = element.innerHTML;
    for (const image of Array.from(template.content.querySelectorAll('img'))) {
      const path = image.getAttribute('title') ?? '';
      image.setAttribute('src', path); image.removeAttribute('title');
    }
    const id = this.activeId() ?? '';
    const html = sanitizeBlogHtml(template.innerHTML, id, this.document).html;
    const original = sanitizeBlogHtml(this.form.controls.contentHtml.value, id, this.document).html;
    if (html !== original) {
      this.form.controls.contentHtml.setValue(html);
      this.form.markAsDirty();
    }
  }
  public paste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text/plain') ?? '').slice(0, 200000);
    this.insertNode(this.document.createTextNode(text));
  }
  public preventDrop(event: DragEvent): void { event.preventDefault(); }
  public preventNavigation(event: MouseEvent): void {
    if (event.target instanceof Element && event.target.closest('a') !== null) event.preventDefault();
  }
  public insert(tag: 'p' | 'h2' | 'h3' | 'strong' | 'em' | 'ul' | 'ol' | 'blockquote' | 'pre' | 'a'): void {
    const editor = this.visual()?.nativeElement;
    if (editor === undefined || this.isSaving()) return;
    const selection = this.document.getSelection();
    const selected = selection?.anchorNode !== null && selection?.anchorNode !== undefined
      && editor.contains(selection.anchorNode) ? selection.toString() : '';
    const node = this.document.createElement(tag);
    if (tag === 'a') {
      const url = this.linkUrl.value.trim();
      if (!isHttpsUrl(url)) { this.error.set(this.text('Escribe un enlace HTTPS válido.', 'Enter a valid HTTPS link.')); return; }
      node.setAttribute('href', url); node.setAttribute('rel', 'noopener noreferrer');
    }
    if (tag === 'ul' || tag === 'ol' || tag === 'pre') {
      const child = this.document.createElement(tag === 'pre' ? 'code' : 'li');
      child.textContent = selected || this.text('Texto', 'Text'); node.appendChild(child);
    } else node.textContent = selected || this.text('Texto', 'Text');
    this.insertNode(node);
  }
  private insertNode(node: Node): void {
    const editor = this.visual()?.nativeElement;
    if (editor === undefined || this.isSaving()) return;
    const selection = this.document.getSelection();
    const range = selection !== null && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (range !== null && editor.contains(range.commonAncestorContainer)) {
      range.deleteContents(); range.insertNode(node); range.setStartAfter(node); range.collapse(true);
      selection?.removeAllRanges(); selection?.addRange(range);
    } else editor.appendChild(node);
    this.captureVisual();
  }
  public async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; input.value = '';
    const id = this.activeId(); const alt = this.imageAlt.value.trim();
    if (file === undefined || id === null || this.isSaving()) return;
    if (alt.length === 0 || alt.length > 300) {
      this.error.set(this.text('Describe la imagen antes de subirla.', 'Describe the image before uploading.')); return;
    }
    if (this.mode() === 'visual') this.captureVisual();
    const generation = this.generation; this.isSaving.set(true); this.error.set('');
    try {
      const path = await this.service.upload(id, file, percent => { if (this.valid(generation)) this.progress.set(percent); });
      if (!this.valid(generation)) return;
      const inert = this.document.createElement('template').content.ownerDocument;
      const image = inert.createElement('img'); image.setAttribute('src', path); image.setAttribute('alt', alt);
      this.form.controls.contentHtml.setValue(this.form.controls.contentHtml.value + image.outerHTML);
      this.form.markAsDirty(); this.mode.set('visual'); this.visualHtml.set(this.visualMarkup(this.clean())); this.message.set(this.text('Imagen privada añadida. Guarda el borrador.', 'Private image added. Save your draft.'));
    } catch { if (this.valid(generation)) this.failed(); }
    finally { if (generation === this.generation) { this.isSaving.set(false); this.progress.set(null); } }
  }
  public async save(): Promise<void> {
    const id = this.activeId();
    if (id === null || this.isSaving() || !this.auth.isAdmin()) return;
    if (this.mode() === 'visual') this.captureVisual();
    this.clean();
    if (this.form.invalid) { this.form.markAllAsTouched(); this.failed('blog-invalid'); return; }
    const value = this.form.getRawValue();
    const draft: BlogDraft = { ...this.baseline, id, title: value.title, slug: value.slug, excerpt: value.excerpt,
      locale: value.locale as 'es' | 'en', tags: value.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      contentHtml: value.contentHtml, contentFormat: 'html', contentVersion: 1, status: 'draft',
      authorUid: this.baseline?.authorUid ?? this.auth.user()?.uid ?? '', revision: this.baseline?.revision ?? 0 };
    try { validateDraft(draft); } catch { this.failed('blog-invalid'); return; }
    const generation = this.generation; this.isSaving.set(true); this.error.set(''); this.message.set('');
    try {
      await this.service.save(draft, this.baseline);
      if (!this.valid(generation)) return;
      this.baseline = { ...draft, revision: draft.revision + 1 };
      this.form.markAsPristine();
      this.message.set(this.text('Borrador guardado. Sigue siendo privado.', 'Draft saved. It remains private.'));
      const records = await this.service.list(); if (this.valid(generation)) this.records.set(records);
    } catch (error: unknown) { if (this.valid(generation)) this.failed(error instanceof Error ? error.message : ''); }
    finally { if (generation === this.generation) this.isSaving.set(false); }
  }
  public async remove(record: BlogDraft): Promise<void> {
    if (this.isSaving() || !this.auth.isAdmin() || !this.discard()
      || !window.confirm(this.text('¿Eliminar el borrador y retirar su versión pública, si existe? No se puede deshacer.',
        'Delete this draft and withdraw its public version, if any? This cannot be undone.'))) return;
    const generation = this.generation; this.isSaving.set(true);
    try {
      await this.service.remove(record); const records = await this.service.list();
      if (this.valid(generation)) { this.records.set(records); this.activeId.set(null); this.form.reset(); }
    } catch (error: unknown) { if (this.valid(generation)) this.failed(error instanceof Error ? error.message : ''); }
    finally { if (generation === this.generation) this.isSaving.set(false); }
  }
  public async toggleBlog(): Promise<void> {
    if (this.isSaving() || !this.auth.isAdmin() || !this.blog.ready() || this.blog.error()) return;
    const enabled = !this.blog.enabled();
    if (!window.confirm(enabled
      ? this.text('¿Activar el blog público? Las versiones publicadas serán accesibles.', 'Enable the public blog? Published versions will become accessible.')
      : this.text('¿Ocultar el blog y bloquear nuevas lecturas públicas?', 'Hide the blog and block new public reads?'))) return;
    const generation = this.generation; this.isSaving.set(true); this.error.set('');
    try { await this.service.setEnabled(enabled); }
    catch { if (this.valid(generation)) this.failed(); }
    finally { if (generation === this.generation) this.isSaving.set(false); }
  }
  public async publication(record: BlogDraft, publish: boolean): Promise<void> {
    if (this.isSaving() || !this.auth.isAdmin()) return;
    if (this.hasUnsavedChanges()) {
      this.error.set(this.text('Guarda o cancela los cambios antes de publicar.', 'Save or cancel your changes before publishing.')); return;
    }
    if (!window.confirm(publish
      ? this.text('¿Publicar esta versión guardada y sus imágenes? Será pública al activar el blog.', 'Publish this saved version and its images? It will be public when the blog is enabled.')
      : this.text('¿Retirar la versión pública? El borrador se conserva.', 'Withdraw the public version? The draft is retained.'))) return;
    const generation = this.generation; this.isSaving.set(true); this.error.set('');
    try {
      if (publish) await this.service.publish(record); else await this.service.unpublish(record);
      const records = await this.service.list();
      if (this.valid(generation)) {
        this.records.set(records); this.activeId.set(null); this.baseline = null; this.form.reset();
        this.message.set(this.text('Publicación actualizada.', 'Publication updated.'));
      }
    } catch (error: unknown) { if (this.valid(generation)) this.failed(error instanceof Error ? error.message : ''); }
    finally { if (generation === this.generation) this.isSaving.set(false); }
  }
  private clean(): string {
    const result = sanitizeBlogHtml(this.form.controls.contentHtml.value, this.activeId() ?? '', this.document);
    if (result.changed) this.warning.set(true);
    if (result.html !== this.form.controls.contentHtml.value) {
      this.form.controls.contentHtml.setValue(result.html); this.form.markAsDirty();
    }
    return result.html;
  }
  private visualMarkup(html: string): string {
    const template = this.document.createElement('template'); template.innerHTML = html;
    for (const image of Array.from(template.content.querySelectorAll('img'))) {
      image.setAttribute('title', image.getAttribute('src') ?? ''); image.removeAttribute('src');
    }
    return template.innerHTML;
  }
  private valid(generation: number): boolean { return generation === this.generation && this.auth.isAdmin(); }
  private discard(): boolean {
    return !this.hasUnsavedChanges() || window.confirm(this.text('¿Descartar los cambios sin guardar?', 'Discard unsaved changes?'));
  }
  private failed(code = ''): void {
    this.error.set(code === 'blog-conflict'
      ? this.text('El borrador cambió en otro dispositivo. Recarga antes de guardar.', 'Draft changed on another device. Reload before saving.')
      : code === 'blog-slug-taken' ? this.text('Ese slug ya existe para este idioma.', 'This slug is already used for this language.')
        : code === 'blog-invalid' ? this.text('Revisa título, slug, HTML y etiquetas (máximo 20).', 'Check title, slug, HTML and tags (maximum 20).')
          : this.text('No se pudo completar. Revisa formato, permisos y conexión.', 'Operation failed. Check format, permissions and connection.'));
  }
  private clear(): void {
    this.generation++; this.baseline = null; this.activeId.set(null); this.records.set([]); this.form.reset();
    this.visualHtml.set(''); this.previewHtml.set(''); this.linkUrl.reset(); this.imageAlt.reset();
    this.isSaving.set(false); this.error.set(''); this.message.set(''); this.warning.set(false); this.progress.set(null);
  }
}
