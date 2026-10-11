import { Component, DestroyRef, effect, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminAuthService } from '../auth/admin-auth.service';
import { AdminContentService } from './admin-content.service';
import { iconKeys } from '../../models/managed-content';
import type { ContentKind, ManagedContent } from '../../models/managed-content';
import { httpsUrlValidator, nonBlankValidator } from '../../models/profile-editor.model';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { missingTranslations } from '../../models/project-media';
import { EditorPreviewComponent } from './editor-preview.component';
import { AdminIconComponent } from '../admin-icon.component';
import { isHttpsUrl } from '../../models/profile-editor.model';

@Component({
  selector: 'app-admin-content', standalone: true, imports: [ReactiveFormsModule, TranslatePipe, EditorPreviewComponent, AdminIconComponent],
  templateUrl: './admin-content.component.html', styleUrl: '../admin-ui.scss',
})
export class AdminContentComponent {
  public safeImage(url: string | undefined): string { return url && isHttpsUrl(url) ? url : ''; }
  private readonly service = inject(AdminContentService);
  private readonly auth = inject(AdminAuthService);
  public readonly i18n = inject(I18nService);
  public readonly kind = inject(ActivatedRoute).snapshot.data['kind'] as ContentKind;
  public readonly records = signal<ManagedContent[]>([]);
  public readonly activeId = signal<string | null>(null);
  public readonly isSaving = signal(false);
  public readonly loading = signal(false);
  public readonly progress = signal<number | null>(null);
  public readonly message = signal('');
  public readonly error = signal('');
  public readonly icons = iconKeys;
  public readonly translationLocale = signal<'es' | 'en'>('es');
  private baseline: ManagedContent | null = null;
  private generation = 0;
  private readonly fb = inject(FormBuilder).nonNullable;
  public readonly galleryMetadata = this.fb.array<ReturnType<AdminContentComponent['imageGroup']>>([]);
  public readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [nonBlankValidator, Validators.maxLength(120)]],
    description: ['', Validators.maxLength(10000)],
    urlImg: ['', httpsUrlValidator], urlRepo: ['', httpsUrlValidator], urlPlay: ['', httpsUrlValidator],
    gallery: [''], links: [''], technologies: [''],
    category: ['language'], iconKey: ['android'], color: ['#78C257'],
    sortOrder: [0, [Validators.min(0), Validators.max(9999)]], published: [true],
    esName: ['', Validators.maxLength(120)], enName: ['', Validators.maxLength(120)],
    esDescription: ['', Validators.maxLength(10000)], enDescription: ['', Validators.maxLength(10000)],
    coverAlt: ['', Validators.maxLength(300)], esCoverAlt: ['', Validators.maxLength(300)], enCoverAlt: ['', Validators.maxLength(300)],
    thumbnailUrl: ['', [httpsUrlValidator, Validators.maxLength(2048)]],
  });

  public constructor() {
    this.form.controls.gallery.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.syncGallery());
    this.galleryMetadata.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.gallery.setValue(this.galleryMetadata.getRawValue().map(item => item.url).join('\n'), { emitEvent: false });
      this.form.markAsDirty();
    });
    effect(() => {
      if (this.auth.access() !== 'loading' && !this.auth.isAdmin()) this.clear();
    });
    inject(DestroyRef).onDestroy(() => this.clear());
    void this.load();
  }

  public hasUnsavedChanges(): boolean { return this.activeId() !== null && this.form.dirty; }
  @HostListener('window:beforeunload', ['$event'])
  public beforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges() || this.isSaving()) { event.preventDefault(); event.returnValue = ''; }
  }

  public async load(): Promise<void> {
    if (this.isSaving() || !this.canDiscard()) return;
    this.clear();
    const generation = this.generation;
    this.loading.set(true);
    try {
      const records = await this.service.list(this.kind);
      if (generation === this.generation && this.auth.isAdmin()) this.records.set(records);
    } catch { if (generation === this.generation) this.failed(); }
    finally { if (generation === this.generation) this.loading.set(false); }
  }

  public edit(record: ManagedContent | null): void {
    if (this.isSaving() || !this.canDiscard()) return;
    this.baseline = record;
    this.galleryMetadata.clear({ emitEvent: false });
    this.activeId.set(record?.id ?? this.service.newId(this.kind));
    this.error.set(''); this.message.set(''); this.form.reset();
    if (record !== null) this.form.patchValue({
      name: record.name ?? '', description: record.description ?? '', urlImg: record.urlImg ?? '',
      urlRepo: record.urlRepo ?? '', urlPlay: record.urlPlay ?? '', gallery: record.gallery?.join('\n') ?? '',
      links: record.links?.map(link => `${link.label} | ${link.url}`).join('\n') ?? '',
      technologies: record.technologyIds?.join(', ') ?? '', category: record.category ?? 'language',
      iconKey: record.iconKey ?? 'android', color: record.color ?? '#78C257',
      sortOrder: record.sortOrder ?? 0, published: record.published ?? false,
      esName: record.translations?.es?.['name'] ?? '', enName: record.translations?.en?.['name'] ?? '',
      esDescription: record.translations?.es?.['description'] ?? '',
      enDescription: record.translations?.en?.['description'] ?? '',
      coverAlt: record.coverAlt ?? '', thumbnailUrl: record.thumbnailUrl ?? '',
      esCoverAlt: record.translations?.es?.['coverAlt'] ?? '', enCoverAlt: record.translations?.en?.['coverAlt'] ?? '',
    });
    this.form.markAsPristine();
  }

  public cancel(): void { if (!this.isSaving() && this.canDiscard()) { this.activeId.set(null); this.baseline = null; this.form.reset(); this.galleryMetadata.clear({ emitEvent: false }); } }

  public async save(): Promise<void> {
    const id = this.activeId();
    if (id === null || this.isSaving()) return;
    if (this.form.invalid || this.galleryMetadata.invalid) { this.form.markAllAsTouched(); this.galleryMetadata.markAllAsTouched(); this.error.set('Revisa los campos y las URLs HTTPS.'); return; }
    const value = this.form.getRawValue();
    const lines = (text: string): string[] => text.split('\n').map(line => line.trim()).filter(line => line !== '');
    const links = lines(value.links).map(line => {
      const separator = line.indexOf('|');
      return { label: separator < 0 ? '' : line.slice(0, separator).trim(), url: line.slice(separator + 1).trim() };
    });
    const data: ManagedContent = { id, name: value.name, description: value.description,
      urlImg: value.urlImg, urlRepo: value.urlRepo, urlPlay: value.urlPlay, gallery: lines(value.gallery), links,
      coverAlt: value.coverAlt, thumbnailUrl: value.thumbnailUrl,
      galleryItems: this.galleryMetadata.getRawValue().map((item, order) => ({ url: item.url, alt: item.alt, order,
        thumbnailUrl: item.thumbnailUrl, translations: { es: { alt: item.esAlt }, en: { alt: item.enAlt } } })),
      technologyIds: value.technologies.split(',').map(item => item.trim()).filter(item => item !== ''),
      category: value.category as 'language' | 'tech', iconKey: value.iconKey, color: value.color,
      sortOrder: value.sortOrder, published: value.published,
      translations: { es: { name: value.esName, description: value.esDescription, coverAlt: value.esCoverAlt },
        en: { name: value.enName, description: value.enDescription, coverAlt: value.enCoverAlt } },
    };
    await this.perform(async () => {
      await this.service.save(this.kind, data, this.baseline);
      this.form.markAsPristine(); this.activeId.set(null);
      this.records.set(await this.service.list(this.kind));
    });
  }

  public async remove(record: ManagedContent): Promise<void> {
    if (this.isSaving() || !this.canDiscard()
      || !window.confirm(this.i18n.text('¿Eliminar este registro? Esta acción no se puede deshacer.'))) return;
    await this.perform(async () => {
      await this.service.remove(this.kind, record);
      this.activeId.set(null); this.form.reset(); this.records.set(await this.service.list(this.kind));
    });
  }

  public async importSkills(): Promise<void> {
    if (!this.canDiscard()) return;
    await this.perform(async () => { await this.service.importSkills(); this.records.set(await this.service.list('skills')); });
  }

  public async upload(event: Event, cover: boolean, thumbnail = false): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    const id = this.activeId();
    if (id === null || files.length === 0 || this.isSaving()) return;
    await this.perform(async () => {
      for (const file of cover ? files.slice(0, 1) : files.slice(0, 20)) {
        const url = await this.service.uploadImage(id, file, percent => this.progress.set(percent));
        if (!this.auth.isAdmin()) return;
        if (thumbnail) this.form.controls.thumbnailUrl.setValue(url);
        else if (cover) this.form.controls.urlImg.setValue(url);
        else this.form.controls.gallery.setValue([this.form.controls.gallery.value, url].filter(Boolean).join('\n'));
        this.form.markAsDirty();
      }
    }, false);
    this.progress.set(null);
  }

  private async perform(action: () => Promise<void>, saved = true): Promise<void> {
    if (this.isSaving() || !this.auth.isAdmin()) return;
    const generation = this.generation;
    this.isSaving.set(true); this.error.set(''); this.message.set('');
    try {
      await action();
      if (generation === this.generation && this.auth.isAdmin() && saved) this.message.set('Datos guardados.');
    } catch (error: unknown) {
      if (generation === this.generation) this.error.set(error instanceof Error && error.message === 'content-conflict'
        ? 'El contenido cambió en otro dispositivo. Recarga antes de guardar.'
        : error instanceof Error && error.message === 'content-invalid' ? 'Revisa los campos y las URLs HTTPS.'
          : error instanceof Error && error.message === 'skills-import-required'
            ? this.i18n.locale() === 'es' ? 'Primero importa las habilidades actuales.' : 'Import existing skills first.'
            : 'No se pudo completar la operación. Revisa tus permisos y conexión.');
    } finally { this.isSaving.set(false); }
  }

  private canDiscard(): boolean {
    return !this.hasUnsavedChanges() || window.confirm(this.i18n.text('Tienes cambios sin guardar. ¿Quieres salir y descartarlos?'));
  }
  public addCapture(): void {
    if (this.isSaving() || !this.auth.isAdmin() || this.activeId() === null || this.galleryMetadata.length >= 60) return;
    this.galleryMetadata.push(this.imageGroup(''));
  }
  public removeCapture(index: number): void {
    if (this.isSaving() || !this.auth.isAdmin() || index < 0 || index >= this.galleryMetadata.length) return;
    this.galleryMetadata.removeAt(index);
  }
  private imageGroup(url: string, alt = '', esAlt = '', enAlt = '', thumbnailUrl = '') {
    return this.fb.group({ url: [url, [Validators.required, httpsUrlValidator, Validators.maxLength(2048)]], alt: [alt, Validators.maxLength(300)], esAlt: [esAlt, Validators.maxLength(300)],
      enAlt: [enAlt, Validators.maxLength(300)], thumbnailUrl: [thumbnailUrl, [httpsUrlValidator, Validators.maxLength(2048)]] });
  }
  private syncGallery(): void {
    const existing = this.galleryMetadata.getRawValue();
    const urls = this.form.controls.gallery.value.split('\n').map(url => url.trim()).filter(Boolean).slice(0, 60);
    this.galleryMetadata.clear({ emitEvent: false });
    for (const url of urls) {
      const current = existing.find(item => item.url === url);
      const stored = this.baseline?.galleryItems?.find(item => item.url === url);
      this.galleryMetadata.push(this.imageGroup(url, current?.alt ?? stored?.alt ?? '',
        current?.esAlt ?? stored?.translations?.es?.['alt'] ?? '', current?.enAlt ?? stored?.translations?.en?.['alt'] ?? '',
        current?.thumbnailUrl ?? stored?.thumbnailUrl ?? ''), { emitEvent: false });
    }
  }
  public editorialGaps(): string[] {
    const value = this.form.getRawValue();
    const gaps = missingTranslations({ es: { name: value.esName, description: value.esDescription },
      en: { name: value.enName, description: value.enDescription } }, ['name', 'description']);
    if (this.kind === 'projects') {
      if (value.coverAlt.trim() === '') gaps.push('alt · portada');
      if (value.esCoverAlt.trim() === '') gaps.push('es · alt portada');
      if (value.enCoverAlt.trim() === '') gaps.push('en · alt portada');
      this.galleryMetadata.getRawValue().forEach((item, index) => {
        for (const [locale, text] of [['original', item.alt], ['es', item.esAlt], ['en', item.enAlt]]) {
          if (text.trim() === '') gaps.push(`${locale} · alt ${index + 1}`);
        }
      });
    }
    return gaps;
  }
  private failed(): void { this.error.set('No se pudo completar la operación. Revisa tus permisos y conexión.'); }
  private clear(): void { this.generation++; this.records.set([]); this.activeId.set(null); this.baseline = null; this.form.reset(); this.galleryMetadata.clear({ emitEvent: false }); }
}
