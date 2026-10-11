import { Component, DestroyRef, effect, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminAuthService } from '../auth/admin-auth.service';
import { AdminProfileService } from './admin-profile.service';
import {
  defaultSocialLinks, httpsUrlValidator, nonBlankValidator, socialPlatforms,
} from '../../models/profile-editor.model';
import type { EditableProfile } from '../../models/profile-editor.model';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { missingTranslations } from '../../models/project-media';
import { EditorPreviewComponent } from '../content/editor-preview.component';
import { I18nService } from '../../i18n/i18n.service';
import { AdminIconComponent } from '../admin-icon.component';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, EditorPreviewComponent, AdminIconComponent],
  templateUrl: './admin-profile.component.html',
  styleUrl: '../admin-ui.scss',
})
export class AdminProfileComponent {
  public readonly i18n = inject(I18nService);
  private readonly auth = inject(AdminAuthService);
  private readonly service = inject(AdminProfileService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private baseline: EditableProfile | null = null;
  private generation = 0;
  public readonly loading = signal(true);
  public readonly isSaving = signal(false);
  public readonly loaded = signal(false);
  public readonly message = signal('');
  public readonly error = signal('');
  public readonly platforms = socialPlatforms;
  public readonly form = this.fb.group({
    name: ['', [nonBlankValidator, Validators.maxLength(120)]],
    profession: ['', [nonBlankValidator, Validators.maxLength(180)]],
    description: ['', [nonBlankValidator, Validators.maxLength(5000)]],
    urlImg: ['', [Validators.required, httpsUrlValidator, Validators.maxLength(2048)]],
    github: ['', [httpsUrlValidator, Validators.maxLength(2048)]],
    facebook: ['', [httpsUrlValidator, Validators.maxLength(2048)]],
    instagram: ['', [httpsUrlValidator, Validators.maxLength(2048)]],
    twitter: ['', [httpsUrlValidator, Validators.maxLength(2048)]],
    whatsapp: ['', [httpsUrlValidator, Validators.maxLength(2048)]],
    esProfession: ['', Validators.maxLength(180)], enProfession: ['', Validators.maxLength(180)],
    esDescription: ['', Validators.maxLength(5000)], enDescription: ['', Validators.maxLength(5000)],
  });

  public constructor() {
    effect(() => {
      if (this.auth.access() !== 'loading' && !this.auth.isAdmin()) {
        this.generation++;
        this.form.reset();
        this.baseline = null;
        this.loaded.set(false);
      }
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      this.baseline = null;
      this.form.reset();
    });
    void this.load();
  }

  public hasUnsavedChanges(): boolean { return this.loaded() && this.form.dirty; }
  public translationGaps(): string[] {
    const value = this.form.getRawValue();
    return missingTranslations({ es: { profession: value.esProfession, description: value.esDescription },
      en: { profession: value.enProfession, description: value.enDescription } }, ['profession', 'description']);
  }

  @HostListener('window:beforeunload', ['$event'])
  public beforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges() || this.isSaving()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  public async load(): Promise<void> {
    if (this.isSaving()) return;
    if (this.hasUnsavedChanges() && !window.confirm('¿Descartar tus cambios y cargar el perfil más reciente?')) return;
    const generation = ++this.generation;
    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const profile = await this.service.load();
      if (generation !== this.generation || !this.auth.isAdmin()) return;
      this.baseline = profile;
      this.form.reset();
      this.form.patchValue(profile);
      this.form.patchValue({ esProfession: profile.translations?.es?.['profession'] ?? '',
        enProfession: profile.translations?.en?.['profession'] ?? '',
        esDescription: profile.translations?.es?.['description'] ?? '',
        enDescription: profile.translations?.en?.['description'] ?? '' });
      for (const link of profile.socialLinks ?? defaultSocialLinks) {
        if (this.platforms.includes(link.platform)) this.form.controls[link.platform].setValue(link.url);
      }
      this.form.markAsPristine();
      this.loaded.set(true);
    } catch {
      if (generation === this.generation) {
        this.error.set('No se pudo cargar el perfil. Revisa tu conexión y tus permisos.');
      }
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  public async save(): Promise<void> {
    if (this.isSaving() || !this.loaded() || this.baseline === null) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.error.set('');
    this.message.set('');
    this.isSaving.set(true);
    const generation = this.generation;
    const value = this.form.getRawValue();
    const profile: EditableProfile = {
      name: value.name.trim(), profession: value.profession.trim(), description: value.description.trim(),
      urlImg: value.urlImg.trim(),
      translations: { es: { profession: value.esProfession.trim(), description: value.esDescription.trim() },
        en: { profession: value.enProfession.trim(), description: value.enDescription.trim() } },
      socialLinks: this.platforms.filter(platform => value[platform] !== '')
        .map(platform => ({ platform, url: value[platform].trim() })),
    };
    try {
      await this.service.save(profile, this.baseline);
      if (generation !== this.generation || !this.auth.isAdmin()) return;
      this.baseline = profile;
      this.form.markAsPristine();
      this.message.set('Perfil guardado. Los cambios se reflejan en el portafolio.');
    } catch (error: unknown) {
      if (generation !== this.generation) return;
      this.error.set(error instanceof Error && error.message === 'profile-conflict'
        ? 'El perfil cambió en otro dispositivo. Recarga los datos antes de guardar; tus cambios siguen aquí.'
        : 'No se pudo guardar. Tus cambios siguen aquí; revisa tu conexión y tus permisos.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
