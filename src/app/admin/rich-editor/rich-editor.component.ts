import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, AfterViewInit, OnChanges, OnDestroy, signal } from '@angular/core';
import { Editor, Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import { TiptapToolbarComponent } from './tiptap-toolbar.component';
import { richHtmlForEditor } from '../../models/rich-text-format';
import { validImage } from '../../models/managed-content';
import { privateImagePath, sanitizeBlogHtml } from '../../models/blog-draft';
import { sanitizeLegalHtml } from '../../terms/legal-html';
import { importImageFile } from './image-import';

/** Shared production editor. No laboratory endpoints, IDs or Firebase configuration. */
@Component({ selector: 'app-rich-editor', standalone: true, imports: [TiptapToolbarComponent],
  template: `@if (ready()) { <app-tiptap-toolbar [editor]="editor" /> }
    <div class="surface"><div #host></div></div>
    @if (images && !disabled) {
      <details class="images"><summary>Imagen</summary>
        <label>Descripción accesible <input #alt maxlength="300" /></label>
        <label>Enlace HTTPS <input #url type="url" placeholder="https://…" /></label><button type="button" (click)="fromUrl(url.value, alt.value)">Insertar imagen por enlace</button>
        <label>PNG, JPEG, WebP o GIF · 10 MB <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" (change)="file($event, alt.value)" /></label>
        <p>Las imágenes quedan en memoria hasta guardar el borrador. Selecciona la imagen para alinearla.</p>
      </details>
    }
    @if (message()) { <p role="status">{{message()}}</p> }`,
  styles: [`:host{display:block;min-width:0;max-width:100%}:host([hidden]){display:none}.surface{border:1px solid #777;padding:20px;background:#101012;color:white;overflow-x:auto;overflow-wrap:anywhere}
    .surface:focus-within{border-color:var(--site-focus,#ff8585);box-shadow:inset 0 0 0 1px var(--site-focus,#ff8585)}
    :host ::ng-deep .tiptap{min-height:280px;outline:none;font-family:Arial,sans-serif;font-size:16px;color:white}
    :host ::ng-deep .tiptap p{margin-block:12px}:host ::ng-deep .tiptap :is(ul,ol){padding-inline-start:1.75rem}
    :host ::ng-deep .tiptap table{border-collapse:collapse}:host ::ng-deep .tiptap :is(td,th){border:1px solid #777;padding:8px}
    :host ::ng-deep .tiptap img{max-width:100%;height:auto}:host ::ng-deep .ProseMirror-selectednode{outline:2px solid var(--site-focus,#ff8585)}
    label{display:block;margin-block:12px}input{max-width:100%;background:#24242a;color:white;border:1px solid #777;padding:8px}
    .images{margin-block:12px}p{margin-block:8px}`] })
export class RichEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() html = '';
  @Input() disabled = false;
  @Input() images = false;
  @Input() documentId = '';
  @Input() uploadImage?: (file: File) => Promise<string>;
  @Input() loadImage?: (path: string) => Promise<Blob>;
  @Output() htmlChange = new EventEmitter<string>();
  @ViewChild('host') host!: ElementRef<HTMLElement>;
  public editor?: Editor;
  public readonly ready = signal(false);
  public readonly message = signal('');
  private unsupported = false;
  private source = '';
  private last = '';
  private boundId = '';
  private working = 0;
  private destroyed = false;
  private readonly files = new Map<string, File>();
  private readonly urls = new Map<string, string>();
  private readonly promoted = new Map<string, string>();
  private clean(html: string): string {
    return this.images ? sanitizeBlogHtml(html, this.documentId, document).html : sanitizeLegalHtml(html, document).html;
  }
  private checkCompatibility(): void {
    this.source = this.clean(this.html);
    // These legal constructs have no lossless equivalent in the configured schema.
    this.unsupported = /<(?:dl|dt|dd|abbr|sup|sub|time|caption|tfoot)\b/i.test(this.source);
    this.message.set(this.unsupported ? 'Este documento contiene HTML avanzado. Edítalo en modo HTML para conservar su estructura.' : '');
  }
  public ngAfterViewInit(): void {
    this.checkCompatibility();
    const owner = this;
    const classes = Extension.create({ name: 'safePresentationClasses', addGlobalAttributes() {
      return [{ types: ['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem', 'table', 'tableRow', 'tableCell', 'tableHeader', 'codeBlock', 'textStyle'], attributes: {
        class: { default: null, parseHTML: element => element.getAttribute('class'), renderHTML: attrs => attrs['class'] ? { class: attrs['class'] } : {} },
      } }];
    } });
    const image = Image.extend({
      addAttributes() { return { ...this.parent?.(), imageAlign: { default: 'left',
        parseHTML: el => ['left', 'center', 'right'].find(align => el.classList.contains('rt-image-' + align)) ?? 'left',
        renderHTML: attrs => ({ class: 'rt-image-' + (['left', 'center', 'right'].includes(attrs['imageAlign']) ? attrs['imageAlign'] : 'left') }) } }; },
      addNodeView() { return ({ node }) => {
        const img = document.createElement('img'); img.alt = String(node.attrs['alt'] ?? '');
        img.className = 'rt-image-' + String(node.attrs['imageAlign'] ?? 'left'); let disposed = false;
        void owner.resolve(String(node.attrs['src'] ?? '')).then(url => { if (!disposed) img.src = url; }).catch(() => { img.title = 'Imagen privada no disponible'; });
        return { dom: img, destroy: () => { disposed = true; } };
      }; },
    });
    this.editor = new Editor({ element: this.host.nativeElement, editable: !this.disabled && !this.unsupported,
      extensions: [StarterKit, TextStyleKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), TableKit, classes, ...(this.images ? [image] : [])],
      content: richHtmlForEditor(this.clean(this.html), document),
      editorProps: { attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Contenido visual' },
        transformPastedHTML: html => richHtmlForEditor(this.clean(html), document),
        handleDrop: () => true,
        handlePaste: (_view, event) => {
          const file = Array.from(event.clipboardData?.files ?? []).find(file => file.type.startsWith('image/'));
          if (file) { event.preventDefault(); if (this.images && !this.disabled) void this.stage(file, 'Imagen pegada'); return true; }
          const pasted = event.clipboardData?.getData('text/html') ?? '';
          if (/<img\b/i.test(pasted)) {
            event.preventDefault();
            if (this.images && !this.disabled) {
              const template = document.createElement('template'); template.innerHTML = pasted;
              const img = template.content.querySelector('img');
              void this.fromUrl(img?.getAttribute('src') ?? '', img?.getAttribute('alt') || 'Imagen pegada');
            }
            return true;
          }
          return false;
        },
      }, onUpdate: () => this.emit(),
    });
    this.last = this.html; this.boundId = this.documentId; queueMicrotask(() => { if (!this.destroyed) this.ready.set(true); });
  }
  public ngOnChanges(): void {
    if (this.editor && this.boundId !== this.documentId) {
      this.urls.forEach(url => URL.revokeObjectURL(url)); this.urls.clear(); this.files.clear(); this.promoted.clear(); this.boundId = this.documentId; this.last = '\0';
    }
    if (this.editor && this.html !== this.last) {
      this.checkCompatibility();
      this.editor.commands.setContent(richHtmlForEditor(this.clean(this.html), document), { emitUpdate: false }); this.last = this.html;
    }
    this.editor?.setEditable(!this.disabled && !this.unsupported, false);
  }
  private emit(): void { this.last = this.getHtml(); this.htmlChange.emit(this.last); }
  public getHtml(): string { return this.unsupported ? this.source : this.editor ? this.clean(this.editor.getHTML()) : this.clean(this.html); }
  public insert(html: string): void { if (this.editor?.isEditable) this.editor.chain().focus().insertContent(richHtmlForEditor(this.clean(html), document)).run(); }
  public insertText(text: string): void { if (this.editor?.isEditable) this.editor.chain().focus().insertContent({ type: 'text', text }).run(); }
  public file(event: Event, alt: string): void {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; input.value = '';
    if (file) void this.stage(file, alt);
  }
  public async fromUrl(url: string, alt: string): Promise<void> {
    if (this.disabled || !this.images || !alt.trim()) return;
    const id = this.documentId; this.working++;
    try {
      const file = await importImageFile(url);
      if (!this.destroyed && !this.disabled && id === this.documentId) await this.stage(file, alt);
    } catch { this.message.set('No se pudo importar. Si el sitio bloquea CORS, descarga y sube el archivo.'); }
    finally { this.working--; }
  }
  public async stage(file: File, alt: string): Promise<void> {
    if (this.disabled || !this.images) return;
    if (!alt.trim() || !validImage(file)) { this.message.set('Describe la imagen. Usa PNG, JPEG, WebP o GIF de hasta 10 MB.'); return; }
    if ((this.editor?.getHTML().match(/<img\b/g) ?? []).length + this.working >= 20) { this.message.set('Máximo 20 imágenes.'); return; }
    const editor = this.editor; const id = this.documentId; if (!editor) return;
    let bookmark = editor.state.selection.getBookmark();
    const map = ({ transaction }: { transaction: import('@tiptap/pm/state').Transaction }) => { bookmark = bookmark.map(transaction.mapping); };
    editor.on('transaction', map); this.working++;
    try {
      const decoded = await createImageBitmap(file); const pixels = decoded.width * decoded.height; decoded.close();
      if (pixels > 40_000_000) throw Error('Máximo 40 megapíxeles.');
      if (this.destroyed || this.disabled || id !== this.documentId) return;
      const path = `blog-drafts/${this.documentId}/pending-${crypto.randomUUID()}.${file.type.split('/')[1]}`;
      this.files.set(path, file); this.urls.set(path, URL.createObjectURL(file));
      editor.view.dispatch(editor.state.tr.setSelection(bookmark.resolve(editor.state.doc)));
      editor.chain().focus().setImage({ src: path, alt: alt.trim().slice(0, 300) }).run();
      this.message.set('Imagen temporal: se subirá al guardar el borrador.');
    } catch { this.message.set('No se pudo preparar la imagen. Revisa formato y tamaño.'); }
    finally { editor.off('transaction', map); this.working--; }
  }
  private async resolve(path: string): Promise<string> {
    if (!privateImagePath(path, this.documentId)) throw Error('Ruta no permitida');
    const cached = this.urls.get(path); if (cached) return cached;
    if (!this.loadImage || path.includes('/pending-')) throw Error('Imagen no disponible');
    const id = this.documentId;
    const blob = await this.loadImage(path); if (this.destroyed || id !== this.documentId) throw Error('Editor cerrado');
    const existing = this.urls.get(path); if (existing) return existing;
    const url = URL.createObjectURL(blob); this.urls.set(path, url); return url;
  }
  public temporaryFile(path: string): File | undefined { return this.files.get(path); }
  public async persist(): Promise<string> {
    if (this.working) throw Error('Espera a que se prepare la imagen antes de guardar.');
    const template = document.createElement('template'); template.innerHTML = this.getHtml();
    for (const image of Array.from(template.content.querySelectorAll('img'))) {
      const path = image.getAttribute('src') ?? ''; if (!path.includes('/pending-')) continue;
      let stored = this.promoted.get(path);
      if (!stored) {
        const file = this.files.get(path); if (!file || !this.uploadImage) throw Error('Imagen temporal perdida. Vuelve a pegarla.');
        stored = await this.uploadImage(file);
        if (!privateImagePath(stored, this.documentId) || this.destroyed) throw Error('Ruta de imagen inválida');
        this.promoted.set(path, stored);
      }
      image.setAttribute('src', stored);
    }
    const html = this.clean(template.innerHTML);
    return html;
  }
  public ngOnDestroy(): void { this.destroyed = true; this.editor?.destroy(); this.urls.forEach(url => URL.revokeObjectURL(url)); this.files.clear(); this.urls.clear(); }
}
