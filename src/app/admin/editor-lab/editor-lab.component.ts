import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule, AngularEditorConfig, provideEditorSanitizer } from '@kolkov/angular-editor';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import { LegalDocumentComponent } from '../../terms/legal-document/legal-document.component';
import { sanitizePublishedHtml } from '../../models/blog-draft';
import { sanitizeLegalHtml } from '../../terms/legal-html';
import { richHtmlForEditor } from '../../models/rich-text-format';
import { TiptapToolbarComponent } from '../rich-editor/tiptap-toolbar.component';
import { RichColorsDirective } from '../../models/rich-colors.directive';
import { LabImagesService, labImagePath } from './lab-images.service';
import { LabImagesDirective } from './lab-images.directive';

export const LAB_SAMPLE = `<h2>Prueba de encabezado</h2><p>Texto normal y <strong>negrita</strong>, <em>cursiva</em>.</p><h3>Segundo encabezado</h3><p><span style="color: #c62828; font-family: Georgia; font-size: 24px">Texto rojo grande</span></p><ul><li>Uno</li><li>Dos</li></ul><p><a href="https://example.com">Enlace de prueba</a></p><table><tbody><tr><th>Campo</th><th>Valor</th></tr><tr><td>Estado</td><td>Recuperado</td></tr></tbody></table>`;
export type LabEditor = 'tiptap' | 'kolkov';
export interface LabRecord { title: string; html: string; editor: LabEditor; }
const storageKey = 'nullsite-editor-lab-v1';

/** Development-only sandbox; explicit image uploads reuse authenticated private Firebase storage. */
@Component({
  selector: 'app-editor-lab', standalone: true,
  imports: [FormsModule, AngularEditorModule, LegalDocumentComponent, TiptapToolbarComponent, RichColorsDirective, LabImagesDirective],
  providers: [LabImagesService, provideEditorSanitizer(html => sanitizeLegalHtml(html, document, 'legal', labImagePath).html)],
  templateUrl: './editor-lab.component.html', styleUrls: ['./editor-lab.component.scss', '../blog/blog-body.scss'],
})
export class EditorLabComponent implements AfterViewInit, OnDestroy {
  private readonly images = inject(LabImagesService);
  public readonly acceptsImage = labImagePath;
  public readonly uploading = signal(false);
  public async insertImageUrl(url: string, alt: string, defer = false): Promise<void> {
    if (this.uploading()) return;
    if (!alt.trim()) { this.status.set('Escribe una descripción accesible de la imagen.'); return; }
    try { const file = await this.images.fromUrl(url); await this.uploadImage(file, alt, defer); }
    catch (error) { this.status.set(error instanceof Error ? error.message : 'No se pudo importar la imagen.'); }
  }
  public pasteImage(event: ClipboardEvent): boolean {
    const files = Array.from(event.clipboardData?.files ?? []);
    const file = files.find(file => file.type.startsWith('image/'));
    if (file) { event.preventDefault(); void this.uploadImage(file, 'Imagen pegada', true); return true; }
    const html = event.clipboardData?.getData('text/html') ?? '';
    if (!/<img\b/i.test(html)) return false;
    event.preventDefault();
    const template = document.createElement('template'); template.innerHTML = html;
    const image = template.content.querySelector('img');
    const src = image?.getAttribute('src') ?? '';
    if (src.startsWith('https://')) void this.insertImageUrl(src, image?.getAttribute('alt') || 'Imagen pegada', true);
    else this.status.set('Pega el archivo de imagen o usa un enlace HTTPS público.');
    return true;
  }
  public async uploadImage(file: File | undefined, alt: string, defer = false): Promise<void> {
    if (!file || this.uploading()) return;
    if (!alt.trim()) { this.status.set('Escribe una descripción accesible de la imagen.'); return; }
    if ((this.currentHtml().match(/<img\b/g) ?? []).length >= 20) { this.status.set('Máximo 20 imágenes por documento.'); return; }
    this.uploading.set(true); const library = this.selected();
    let bookmark = this.editor?.state.selection.getBookmark();
    const mapSelection = ({ transaction }: { transaction: import('@tiptap/pm/state').Transaction }) => { bookmark = bookmark?.map(transaction.mapping); };
    this.editor?.on('transaction', mapSelection);
    this.status.set(defer ? 'Preparando imagen en memoria…' : 'Subiendo imagen privada a Firebase…');
    try {
      const path = defer ? await this.images.stage(file) : await this.images.upload(file);
      if (library === 'tiptap' && this.editor && !this.editor.isDestroyed) {
        if (bookmark) this.editor.view.dispatch(this.editor.state.tr.setSelection(bookmark.resolve(this.editor.state.doc)));
        this.editor.chain().focus().setImage({ src: path, alt: alt.trim().slice(0, 300) }).run();
      }
      else {
        const img = document.createElement('img'); img.setAttribute('data-image-path', path); img.alt = alt.trim().slice(0, 300);
        this.kolkovHtml += img.outerHTML;
      }
      this.status.set(defer ? 'Imagen temporal en memoria. Solo se subirá al guardar; al recargar sin guardar se pierde.' : 'Imagen subida a Firebase como archivo privado de laboratorio. Guarda el documento para conservar la referencia.');
    } catch (error) { this.status.set(error instanceof Error ? error.message : 'No se pudo subir la imagen.'); }
    finally { this.editor?.off('transaction', mapSelection); this.uploading.set(false); }
  }
  @ViewChild('tiptapHost') private host!: ElementRef<HTMLElement>;
  public editor?: Editor;
  public readonly selected = signal<LabEditor>('tiptap');
  public kolkovHtml = LAB_SAMPLE;
  public readonly saved = signal<LabRecord | null>(null);
  public readonly status = signal('');
  public readonly config: AngularEditorConfig = {
    editable: true, spellcheck: true, minHeight: '280px', sanitize: true,
    defaultParagraphSeparator: 'p', fonts: [{ class: 'Arial', name: 'Arial' }, { class: 'Georgia', name: 'Georgia' }, { class: 'monospace', name: 'Monospace' }],
    toolbarHiddenButtons: [['insertImage', 'insertVideo', 'toggleEditorMode']],
  };
  public ngAfterViewInit(): void {
    this.editor = new Editor({ element: this.host.nativeElement,
      extensions: [StarterKit, TextStyleKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), TableKit, this.images.extension()], content: LAB_SAMPLE,
      editorProps: { attributes: { 'aria-label': 'Contenido Tiptap', role: 'textbox', 'aria-multiline': 'true' }, handlePaste: (_view, event) => this.pasteImage(event) },
    });
    // Notify the toolbar after the editor is created outside the initial template pass.
    queueMicrotask(() => this.ready.set(true));
  }
  public readonly ready = signal(false);
  public ngOnDestroy(): void { this.editor?.destroy(); }
  public currentHtml(): string { return this.selected() === 'tiptap' ? this.editor?.getHTML() ?? '' : this.kolkovHtml; }
  public snapshot(): LabRecord { return { title: 'Documento recuperado', html: sanitizeLegalHtml(this.currentHtml(), document, 'legal', labImagePath).html, editor: this.selected() }; }
  public reopen(): void {
    const record = this.saved(); if (!record) return;
    const html = sanitizeLegalHtml(record.html, document, 'legal', labImagePath).html;
    this.selected.set(record.editor);
    if (record.editor === 'tiptap') this.editor?.commands.setContent(richHtmlForEditor(html, document));
    else this.kolkovHtml = html;
  }
  public async saveLocal(): Promise<void> {
    if (this.uploading()) return;
    try {
      const record = this.snapshot();
      if (this.images.hasPending(record.html)) {
        this.uploading.set(true); this.status.set('Guardando: subiendo imágenes temporales a Firebase…');
        record.html = await this.images.persistHtml(record.html);
      }
      localStorage.setItem(storageKey, JSON.stringify(record)); this.saved.set(record);
      this.status.set('Guardado local: imágenes temporales subidas y referencias conservadas.');
    } catch (error) { this.status.set(error instanceof Error ? error.message : 'No se pudo guardar localmente.'); }
    finally { this.uploading.set(false); }
  }
  public recoverLocal(): void {
    try { this.accept(JSON.parse(localStorage.getItem(storageKey) ?? 'null')); }
    catch { this.status.set('No se pudo recuperar el documento.'); }
  }
  private accept(value: unknown): void {
    const record = value as Partial<LabRecord> | null;
    if (!record || typeof record.html !== 'string' || record.html.length > 200000 || typeof record.title !== 'string'
      || !['tiptap', 'kolkov'].includes(record.editor ?? '')) throw Error('invalid-lab-record');
    this.saved.set(record as LabRecord); this.status.set('Recuperado: el lector de legales aplica la seguridad real de la web.');
  }
  public legalResult() { return sanitizeLegalHtml(this.saved()?.html ?? '', document, 'legal', labImagePath); }
  public blogResult(): string { return sanitizePublishedHtml(this.saved()?.html ?? '', 'es-lab', 'v1', document); }
  public async firestore(write: boolean): Promise<void> {
    // Hardcoded emulator endpoint/project; never allow a configurable production URL.
    if (!['localhost', '127.0.0.1'].includes(location.hostname)) { this.status.set('Solo disponible en localhost.'); return; }
    const endpoint = 'http://127.0.0.1:8185/v1/projects/demo-nullsite-phase2/databases/(default)/documents/editor-lab/roundtrip';
    try {
      const record = this.snapshot();
      if (write && this.images.hasPending(record.html)) record.html = await this.images.persistHtml(record.html);
      const response = await fetch(endpoint, write ? { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
        body: JSON.stringify({ fields: { html: { stringValue: record.html }, title: { stringValue: record.title }, editor: { stringValue: record.editor } } }) }
        : { headers: { Authorization: 'Bearer owner' } });
      if (!response.ok) throw Error('emulator-failed');
      const result = await response.json();
      if (!write) this.accept({ html: result.fields.html.stringValue, title: result.fields.title.stringValue, editor: result.fields.editor.stringValue });
      else this.status.set('Guardado en Firestore EMULADO. Recupera para ver el resultado.');
    } catch { this.status.set('Emulador no disponible o documento inválido. No se escribió en producción.'); }
  }
  public reset(): void { this.editor?.commands.setContent(LAB_SAMPLE); this.kolkovHtml = LAB_SAMPLE; this.saved.set(null); }
}
