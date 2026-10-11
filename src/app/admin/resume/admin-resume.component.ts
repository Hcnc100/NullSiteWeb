import { Component, DestroyRef, effect, HostListener, inject, signal } from '@angular/core';
import { AdminResumeService } from './admin-resume.service';
import { AdminAuthService } from '../auth/admin-auth.service';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import type { Locale } from '../../i18n/translations';
import type { ResumeSettings } from '../../models/resume';
import { validResumeForLocale } from '../../models/resume';

@Component({ selector: 'app-admin-resume', standalone: true, imports: [TranslatePipe],
  templateUrl: './admin-resume.component.html', styleUrl: '../admin-ui.scss' })
export class AdminResumeComponent {
  private readonly service = inject(AdminResumeService);
  private readonly auth = inject(AdminAuthService);
  public readonly i18n = inject(I18nService);
  public readonly locale = signal<Locale>('es');
  public readonly validResumeForLocale = validResumeForLocale;
  public readonly settings = signal<ResumeSettings>({});
  public readonly file = signal<File | null>(null);
  public readonly isSaving = signal(false);
  public readonly loading = signal(true);
  public readonly progress = signal(0);
  public readonly error = signal('');
  public readonly message = signal('');
  private generation = 0;

  public constructor() {
    effect(() => { if (this.auth.access() !== 'loading' && !this.auth.isAdmin()) this.clear(); });
    inject(DestroyRef).onDestroy(() => this.clear());
    void this.load();
  }
  public hasUnsavedChanges(): boolean { return this.file() !== null; }
  @HostListener('window:beforeunload', ['$event'])
  public beforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges() || this.isSaving()) { event.preventDefault(); event.returnValue = ''; }
  }
  public selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null); input.value = '';
  }
  public async load(): Promise<void> {
    const generation = this.generation;
    this.loading.set(true); this.error.set('');
    try {
      const settings = await this.service.load();
      if (generation === this.generation && this.auth.isAdmin()) this.settings.set(settings);
    } catch { this.error.set('No se pudo completar la operación. Revisa tus permisos y conexión.'); }
    finally { this.loading.set(false); }
  }
  public async publish(): Promise<void> {
    const file = this.file();
    if (file === null || this.isSaving()
      || !window.confirm(this.i18n.text('El PDF será público. ¿Confirmas su publicación?'))) return;
    await this.perform(async () => {
      await this.service.publish(this.locale(), file, this.settings(), percent => this.progress.set(percent));
      this.file.set(null);
    });
  }
  public async withdraw(): Promise<void> {
    if (this.isSaving() || !window.confirm(this.i18n.text('Retirar CV'))) return;
    await this.perform(async () => this.service.withdraw(this.locale(), this.settings()));
  }
  public setLocale(locale: Locale): void {
    if (this.isSaving() || locale === this.locale()) return;
    if (this.file() && !window.confirm(this.i18n.text('¿Descartar los cambios sin guardar?'))) return;
    this.file.set(null);
    this.locale.set(locale);
  }
  private async perform(action: () => Promise<void>): Promise<void> {
    const generation = this.generation;
    this.isSaving.set(true); this.error.set(''); this.message.set('');
    try {
      await action();
      const settings = await this.service.load();
      if (generation === this.generation && this.auth.isAdmin()) {
        this.settings.set(settings); this.message.set('Datos guardados.');
      }
    } catch (error: unknown) {
      if (generation === this.generation) this.error.set(error instanceof Error && error.message === 'pdf-invalid'
        ? 'Selecciona un PDF válido de hasta 10 MiB.' : error instanceof Error && error.message === 'content-conflict'
          ? 'El contenido cambió en otro dispositivo. Recarga antes de guardar.'
          : 'No se pudo completar la operación. Revisa tus permisos y conexión.');
    } finally { this.isSaving.set(false); }
  }
  private clear(): void { this.generation++; this.file.set(null); this.settings.set({}); }
}
