import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, effect, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminAuthService } from '../auth/admin-auth.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { LegalDocumentComponent } from '../../terms/legal-document/legal-document.component';
import { legalHref, sanitizeLegalHtml } from '../../terms/legal-html';
import type { Terms } from '../../models/Terms';
import { AdminLegalService } from './admin-legal.service';
import type { LegalDraft, LegalHistory, LegalRecord } from './legal-editor.model';
import { legalContent, sameTerms } from './legal-editor.model';
import { RichEditorComponent } from '../rich-editor/rich-editor.component';

@Component({
  selector: 'app-admin-legal', standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe, LegalDocumentComponent, RichEditorComponent],
  templateUrl: './admin-legal.component.html', styleUrls: ['../admin-ui.scss', './legal-editor.scss'],
})
export class AdminLegalComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly service = inject(AdminLegalService);
  private readonly document = inject(DOCUMENT);
  public readonly i18n = inject(I18nService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private baseline: LegalDraft | null = null;
  private base: Terms | null = null;
  private rebase = false;
  private generation = 0;
  private historyGeneration = 0;
  public readonly records = signal<LegalRecord[]>([]);
  public readonly history = signal<LegalHistory[]>([]);
  public readonly activeId = signal<string | null>(null);
  public readonly loading = signal(false);
  public readonly isSaving = signal(false);
  public readonly error = signal('');
  public readonly message = signal('');
  public readonly warning = signal(false);
  public readonly preview = signal<Terms | null>(null);
  public readonly saved = signal<LegalDraft | null>(null);
  public readonly mode = signal<'html' | 'visual'>('html');
  public readonly visualHtml = signal('');
  private readonly visual = viewChild<ElementRef<HTMLElement>>('visual');
  public readonly rich = viewChild(RichEditorComponent);
  public richChanged(html: string): void {
    if (this.isSaving() || !this.auth.isAdmin()) return;
    this.form.controls.content.setValue(html); this.form.markAsDirty();
  }
  public readonly formats = ['h2', 'h3', 'p', 'strong', 'em', 'ul', 'ol', 'blockquote'] as const;
  public readonly link = this.fb.control('');
  public readonly form = this.fb.group({ title: ['', [Validators.required, Validators.maxLength(180)]],
    content: ['', [Validators.required, Validators.maxLength(500_000)]] });

  public constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => { this.preview.set(null); this.warning.set(false); });
    effect(() => {
      if (this.auth.access() !== 'loading' && !this.auth.isAdmin()) {
        this.generation++; this.clear(); this.records.set([]); this.loading.set(false);
        this.error.set(''); this.message.set('');
      }
    });
    inject(DestroyRef).onDestroy(() => { this.generation++; this.clear(); this.records.set([]); });
    void this.load();
  }
  private clear(): void {
    this.historyGeneration++;
    this.activeId.set(null); this.baseline = null; this.base = null; this.rebase = false;
    this.saved.set(null); this.history.set([]); this.preview.set(null); this.form.reset();
    this.mode.set('html'); this.visualHtml.set(''); this.link.reset();
  }
  public hasUnsavedChanges(): boolean { return this.activeId() !== null && this.form.dirty; }
  @HostListener('window:beforeunload', ['$event'])
  public beforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges() || this.isSaving()) { event.preventDefault(); event.returnValue = ''; }
  }
  private discard(): boolean {
    return !this.hasUnsavedChanges() || window.confirm(this.i18n.text('¿Descartar los cambios legales sin guardar?'));
  }
  public async load(): Promise<void> {
    if (!this.auth.isAdmin() || this.isSaving() || !this.discard()) return;
    const generation = ++this.generation;
    this.clear(); this.loading.set(true); this.error.set(''); this.message.set('');
    try {
      const records = await this.service.list();
      if (generation === this.generation && this.auth.isAdmin()) this.records.set(records);
    } catch { if (generation === this.generation) this.error.set('No se pudieron cargar los documentos legales. Revisa tu conexión y permisos.'); }
    finally { if (generation === this.generation) this.loading.set(false); }
  }
  public edit(record: LegalRecord | null, fromPublic = false): void {
    if (!this.auth.isAdmin() || this.isSaving() || this.loading() || !this.discard()) return;
    if (fromPublic && !window.confirm(this.i18n.text('Se sustituirá el borrador por la versión pública. Tendrás que guardar y publicar de nuevo. ¿Continuar?'))) return;
    this.generation++; this.clear(); this.error.set(''); this.message.set('');
    this.activeId.set(record?.id ?? this.service.newId());
    this.baseline = record?.draft ?? null; this.base = record?.published ?? null; this.rebase = fromPublic;
    this.saved.set(this.baseline);
    this.form.reset((fromPublic ? record?.published : record?.draft ?? record?.published) ?? { title: '', content: '' });
    if (fromPublic) this.form.markAsDirty();
      if (record !== null) void this.loadHistory(record.id);
      this.switchMode('visual');
  }
  public cancel(): void { if (!this.isSaving() && this.discard()) { this.generation++; this.clear(); } }
  public switchMode(mode: 'html' | 'visual'): void {
    if (this.isSaving() || !this.auth.isAdmin() || mode === this.mode()) return;
    if (this.mode() === 'visual') this.captureVisual();
    const raw = this.form.controls.content.value;
    if (mode === 'visual' && raw.trim() !== '') {
      const result = sanitizeLegalHtml(raw, this.document);
      if (result.rejected !== null) { this.error.set('HTML legal inválido, vacío o demasiado complejo. No se guardó nada.'); return; }
      if (result.html !== raw) { this.form.controls.content.setValue(result.html); this.form.markAsDirty(); }
      this.warning.set(result.changed); this.visualHtml.set(result.html);
    } else if (mode === 'visual') this.visualHtml.set('');
    this.mode.set(mode);
  }
  public captureVisual(): void {
    if (this.rich()) return;
    if (this.isSaving() || !this.auth.isAdmin()) return;
    const element = this.visual()?.nativeElement;
    if (element !== undefined && element.innerHTML !== this.form.controls.content.value) {
      this.form.controls.content.setValue(element.innerHTML); this.form.markAsDirty();
    }
  }
  public paste(event: ClipboardEvent): void {
    event.preventDefault();
    // Never allow the browser to activate clipboard HTML/resources before sanitization.
    const text = event.clipboardData?.getData('text/plain') ?? '';
    if (text.length + this.form.controls.content.value.length > 500_000) {
      this.error.set('HTML legal inválido, vacío o demasiado complejo. No se guardó nada.'); return;
    }
    this.insertNode(this.document.createTextNode(text));
  }
  public preventNativeInsert(event: InputEvent): void {
    if (['insertFromPaste', 'insertFromDrop', 'insertFromYank'].includes(event.inputType)) event.preventDefault();
  }
  public preventNavigation(event: Event): void {
    if ((event.target as HTMLElement).closest('a') !== null) event.preventDefault();
  }
  public insert(tag: typeof this.formats[number] | 'a'): void {
    if (!this.auth.isAdmin() || this.isSaving()) return;
    const element = this.document.createElement(tag);
    if (tag === 'a') {
      const href = legalHref(this.link.value.trim());
      if (href === null) { this.error.set('Introduce un enlace HTTPS o correo válido.'); return; }
      element.setAttribute('href', href);
    }
    const selection = this.document.getSelection();
    const editor = this.visual()?.nativeElement;
    const selected = selection !== null && selection.anchorNode !== null && selection.focusNode !== null
      && editor?.contains(selection.anchorNode) === true && editor.contains(selection.focusNode) ? selection.toString() : '';
    const text = selected || (tag === 'a' ? this.link.value : this.i18n.text('Texto de ejemplo'));
    if (tag === 'ul' || tag === 'ol') { const item = this.document.createElement('li'); item.textContent = text; element.appendChild(item); }
    else element.textContent = text;
    this.insertNode(element);
  }
  private insertNode(node: Node): void {
    const rich = this.rich();
    if (rich) { if (node.nodeType === 3) rich.insertText(node.textContent ?? ''); else { const container = this.document.createElement('div'); container.appendChild(node); rich.insert(container.innerHTML); } return; }
    const editor = this.visual()?.nativeElement;
    if (editor === undefined || !this.auth.isAdmin() || this.isSaving()) return;
    const selection = this.document.getSelection();
    const range = selection !== null && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (range !== null && editor.contains(range.commonAncestorContainer)) {
      range.deleteContents(); range.insertNode(node); range.setStartAfter(node); range.collapse(true);
      selection?.removeAllRanges(); selection?.addRange(range);
    } else editor.appendChild(node);
    this.captureVisual(); editor.focus();
  }
  public structure(): void {
    if (this.isSaving() || !this.auth.isAdmin() || !this.discard()) return;
    // Formatting scaffolding only: no fabricated legal policy or dates.
    const html = '<h2><br></h2><p><br></p>';
    this.mode.set('visual'); this.visualHtml.set(html); this.form.controls.content.setValue(html);
    this.form.markAsDirty(); this.message.set('Estructura insertada. Sustituye los ejemplos por tu texto legal antes de publicar.');
  }
  public normalize(): void {
    if (this.isSaving() || !this.auth.isAdmin()) return;
    if (this.mode() === 'visual') this.captureVisual();
    const result = sanitizeLegalHtml(this.form.controls.content.value, this.document);
    if (result.rejected !== null) { this.error.set('HTML legal inválido, vacío o demasiado complejo. No se guardó nada.'); return; }
    const title = this.form.controls.title.value.trim();
    const changed = result.html !== this.form.controls.content.value || title !== this.form.controls.title.value;
    if (changed) { this.form.patchValue({ title, content: result.html }); this.form.markAsDirty(); }
    this.warning.set(result.changed || changed);
    if (this.mode() === 'visual') this.visualHtml.set(result.html);
    this.error.set(''); this.showPreview(false);
  }
  public showPreview(capture = true): void {
    if (capture && this.mode() === 'visual') this.captureVisual();
    try { this.preview.set(legalContent(this.form.getRawValue(), this.document)); this.error.set(''); }
    catch { this.preview.set(null); this.error.set('HTML legal inválido, vacío o demasiado complejo. No se guardó nada.'); }
  }
  public async save(): Promise<void> {
    const id = this.activeId();
    if (!this.auth.isAdmin() || this.isSaving() || id === null) return;
    if (this.mode() === 'visual') this.captureVisual();
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    let value: Terms;
    try { value = legalContent(this.form.getRawValue(), this.document); }
    catch { this.error.set('HTML legal inválido, vacío o demasiado complejo. No se guardó nada.'); return; }
    if (!sameTerms(value, this.form.getRawValue())) {
      this.error.set('Normaliza el HTML y revisa la vista previa antes de guardar.'); return;
    }
    const generation = this.generation;
    this.isSaving.set(true); this.error.set(''); this.message.set('');
    try {
      const draft = await this.service.save(id, value, this.baseline, this.base, this.rebase);
      if (generation !== this.generation || !this.auth.isAdmin()) return;
      this.baseline = draft; this.saved.set(draft); this.rebase = false; this.form.markAsPristine();
      this.records.update(records => [{ id, published: this.base, draft }, ...records.filter(record => record.id !== id)]);
      this.message.set('Borrador legal guardado. La versión pública no cambió.');
    } catch (error) { if (generation === this.generation) this.failure(error); }
    finally { this.isSaving.set(false); }
  }
  public async publish(): Promise<void> {
    const draft = this.saved();
    if (!this.auth.isAdmin() || this.isSaving() || draft === null || this.hasUnsavedChanges()
      || draft.revision === draft.publishedRevision) return;
    if (!window.confirm(this.i18n.text('¿Publicar esta versión legal guardada? Será visible inmediatamente en la URL existente.'))) return;
    const generation = this.generation;
    this.isSaving.set(true); this.error.set(''); this.message.set('');
    try {
      const next = await this.service.publish(draft);
      if (generation !== this.generation || !this.auth.isAdmin()) return;
      this.baseline = next; this.base = next.base; this.saved.set(next);
      this.records.update(records => records.map(record => record.id === next.id
        ? { id: next.id, published: next.base, draft: next } : record));
      this.message.set('Versión legal publicada. Se conservó la URL y se guardó historial.');
      void this.loadHistory(next.id);
    } catch (error) { if (generation === this.generation) this.failure(error); }
    finally { this.isSaving.set(false); }
  }
  private failure(error: unknown): void {
    if (error instanceof Error && error.message === 'legal-size') {
      this.error.set('El documento y su copia anterior superan el tamaño permitido. Reduce el contenido; tus cambios siguen aquí.'); return;
    }
    this.error.set(error instanceof Error && error.message === 'legal-conflict'
      ? 'El documento cambió en otro dispositivo. Tus cambios siguen aquí. Recarga y compara; usa la versión pública como base si necesitas reconciliarla.'
      : 'No se pudo guardar o publicar. Tus cambios siguen aquí; revisa conexión y permisos.');
  }
  public async loadHistory(id: string): Promise<void> {
    const generation = this.generation;
    const historyGeneration = ++this.historyGeneration;
    try {
      const history = await this.service.history(id);
      if (generation === this.generation && historyGeneration === this.historyGeneration && this.auth.isAdmin()) this.history.set(history);
    } catch { if (generation === this.generation && historyGeneration === this.historyGeneration) this.error.set('No se pudo cargar el historial. Puedes reintentarlo.'); }
  }
  public restore(value: Terms): void {
    if (!this.auth.isAdmin() || this.isSaving() || !this.discard()) return;
    this.mode.set('html'); this.visualHtml.set('');
    this.form.patchValue({ title: value.title, content: value.content }); this.form.markAsDirty();
    this.message.set('Versión copiada al editor. Revisa, normaliza y guarda; restaurar no publica.');
  }
}
