import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule, AngularEditorConfig } from '@kolkov/angular-editor';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import { LegalDocumentComponent } from '../../terms/legal-document/legal-document.component';
import { sanitizePublishedHtml } from '../../models/blog-draft';
import { sanitizeLegalHtml } from '../../terms/legal-html';

export const LAB_SAMPLE = `<h2>Prueba de encabezado</h2><p>Texto normal y <strong>negrita</strong>, <em>cursiva</em>.</p><h3>Segundo encabezado</h3><p><span style="color: #c62828; font-family: Georgia; font-size: 24px">Texto rojo grande</span></p><ul><li>Uno</li><li>Dos</li></ul><p><a href="https://example.com">Enlace de prueba</a></p><table><tbody><tr><th>Campo</th><th>Valor</th></tr><tr><td>Estado</td><td>Recuperado</td></tr></tbody></table>`;
export type LabEditor = 'tiptap' | 'kolkov';
export interface LabRecord { title: string; html: string; editor: LabEditor; }
const storageKey = 'nullsite-editor-lab-v1';

/** Development-only sandbox. No Firebase SDK or production credentials. */
@Component({
  selector: 'app-editor-lab', standalone: true,
  imports: [FormsModule, AngularEditorModule, LegalDocumentComponent],
  templateUrl: './editor-lab.component.html', styleUrls: ['./editor-lab.component.scss', '../blog/blog-body.scss'],
})
export class EditorLabComponent implements AfterViewInit, OnDestroy {
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
      extensions: [StarterKit, TextStyleKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), TableKit], content: LAB_SAMPLE,
      editorProps: { attributes: { 'aria-label': 'Contenido Tiptap', role: 'textbox', 'aria-multiline': 'true' } },
    });
  }
  public ngOnDestroy(): void { this.editor?.destroy(); }
  public currentHtml(): string { return this.selected() === 'tiptap' ? this.editor?.getHTML() ?? '' : this.kolkovHtml; }
  public snapshot(): LabRecord { return { title: 'Documento recuperado', html: this.currentHtml(), editor: this.selected() }; }
  public saveLocal(): void {
    try { localStorage.setItem(storageKey, JSON.stringify(this.snapshot())); this.status.set('Guardado local: recupera para verificar el lector.'); }
    catch { this.status.set('No se pudo guardar localmente.'); }
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
  public legalResult() { return sanitizeLegalHtml(this.saved()?.html ?? '', document); }
  public blogResult(): string { return sanitizePublishedHtml(this.saved()?.html ?? '', 'es-lab', 'v1', document); }
  public async firestore(write: boolean): Promise<void> {
    // Hardcoded emulator endpoint/project; never allow a configurable production URL.
    if (!['localhost', '127.0.0.1'].includes(location.hostname)) { this.status.set('Solo disponible en localhost.'); return; }
    const endpoint = 'http://127.0.0.1:8185/v1/projects/demo-nullsite-phase2/databases/(default)/documents/editor-lab/roundtrip';
    try {
      const record = this.snapshot();
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
