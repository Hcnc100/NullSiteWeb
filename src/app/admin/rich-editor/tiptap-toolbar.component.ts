import { Component, Input, OnChanges, OnDestroy, signal, inject, ElementRef, HostListener } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUndo, faRedo, faBold, faItalic, faUnderline, faStrikethrough, faListUl, faListOl, faAlignLeft, faAlignCenter, faAlignRight, faQuoteLeft, faCode, faEraser, faMinus, faLink, faUnlink, faTable, faFont, faHighlighter, faPalette, faChevronDown, faCheck, faPlus, faTrash, faArrowsUpDown, faArrowsLeftRight } from '@fortawesome/free-solid-svg-icons';
import { Editor } from '@tiptap/core';
import { legalHref } from '../../terms/legal-html';
import { safeHexColor } from '../../models/rich-text-format';

@Component({
  selector: 'app-tiptap-toolbar', standalone: true, imports: [FontAwesomeModule],
  templateUrl: './tiptap-toolbar.component.html', styleUrl: './tiptap-toolbar.component.scss',
})
export class TiptapToolbarComponent implements OnChanges, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  public menuClick(event: MouseEvent): void {
    const target = event.target instanceof Element ? event.target.closest('summary')?.parentElement : null;
    if (target instanceof HTMLDetailsElement) this.closeMenus(target);
  }
  private closeMenus(except?: HTMLDetailsElement): void {
    for (const menu of Array.from(this.host.nativeElement.querySelectorAll<HTMLDetailsElement>('details[open]'))) {
      if (menu !== except) menu.open = false;
    }
  }
  @HostListener('document:click', ['$event'])
  public outsideClick(event: MouseEvent): void {
    if (event.target instanceof Node && !this.host.nativeElement.contains(event.target)) this.closeMenus();
  }
  @HostListener('document:keydown.escape', ['$event'])
  public escapeMenus(event: KeyboardEvent): void {
    const open = this.host.nativeElement.querySelector<HTMLDetailsElement>('details[open]');
    if (!open) return;
    this.closeMenus(); event.preventDefault(); open.querySelector('summary')?.focus();
  }
  @Input() editor?: Editor;
  private subscribed?: Editor;
  private readonly revision = signal(0);
  private readonly refresh = () => this.revision.update(v => v + 1);
  public readonly message = signal('');
  public readonly tableIcon = faTable;
  public readonly tools = [
    { key: 'undo', label: 'Deshacer', icon: faUndo }, { key: 'redo', label: 'Rehacer', icon: faRedo },
    { key: 'bold', label: 'Negrita', icon: faBold }, { key: 'italic', label: 'Cursiva', icon: faItalic },
    { key: 'underline', label: 'Subrayado', icon: faUnderline }, { key: 'strike', label: 'Tachado', icon: faStrikethrough },
    { key: 'bulletList', label: 'Lista con viñetas', icon: faListUl }, { key: 'orderedList', label: 'Lista numerada', icon: faListOl },
    { key: 'left', label: 'Alinear a la izquierda', icon: faAlignLeft }, { key: 'center', label: 'Centrar', icon: faAlignCenter },
    { key: 'right', label: 'Alinear a la derecha', icon: faAlignRight },
    { key: 'blockquote', label: 'Cita', icon: faQuoteLeft }, { key: 'codeBlock', label: 'Bloque de código', icon: faCode },
    { key: 'horizontalRule', label: 'Separador', icon: faMinus }, { key: 'clear', label: 'Quitar formato', icon: faEraser },
  ];
  public readonly linkIcon = faLink;
  public readonly unlinkIcon = faUnlink;
  public readonly textColorIcon = faFont;
  public readonly backgroundIcon = faHighlighter;
  public readonly paletteIcon = faPalette;
  public readonly resetIcon = faEraser;
  public readonly chevronIcon = faChevronDown;
  public readonly applyIcon = faCheck;
  public readonly tableActions = [
    { action: 'insert', label: 'Insertar tabla', icon: faPlus, second: faTable },
    { action: 'row', label: 'Añadir fila', icon: faPlus, second: faArrowsUpDown },
    { action: 'column', label: 'Añadir columna', icon: faPlus, second: faArrowsLeftRight },
    { action: 'deleteRow', label: 'Eliminar fila', icon: faTrash, second: faArrowsUpDown },
    { action: 'deleteColumn', label: 'Eliminar columna', icon: faTrash, second: faArrowsLeftRight },
    { action: 'delete', label: 'Eliminar tabla', icon: faTrash, second: faTable },
  ];
  public readonly palette = [
    { value: 'default', label: 'Blanco (predeterminado)', color: '#ffffff' },
    { value: '#ff8585', label: 'Rojo', color: '#ff8585' },
    { value: '#a9c7ff', label: 'Azul', color: '#a9c7ff' },
    { value: '#9cdbb1', label: 'Verde', color: '#9cdbb1' },
  ];
  public colorLabel(): string { const value = this.value('color'); return this.palette.find(c => c.value === value)?.label ?? safeHexColor(value) ?? 'Mixto'; }
  public colorSwatch(): string { return this.palette.find(c => c.value === this.value('color'))?.color ?? safeHexColor(this.value('color')) ?? '#ffffff'; }
  public ngOnChanges(): void {
    this.subscribed?.off('transaction', this.refresh);
    this.subscribed = this.editor; this.subscribed?.on('transaction', this.refresh);
  }
  public ngOnDestroy(): void { this.subscribed?.off('transaction', this.refresh); }
  public active(key: string): boolean {
    this.revision();
    if (['left', 'center', 'right'].includes(key) && this.editor?.isActive('image')) return (this.editor.getAttributes('image')['imageAlign'] ?? 'left') === key;
    return ['left', 'center', 'right'].includes(key) ? !!this.editor?.isActive({ textAlign: key }) : !!this.editor?.isActive(key);
  }
  public disabled(key: string): boolean {
    this.revision(); if (!this.editor) return true;
    if (key === 'undo') return !this.editor.can().undo();
    if (key === 'redo') return !this.editor.can().redo();
    if (key === 'unlink') return !this.editor.isActive('link');
    return false;
  }
  public value(kind: string): string {
    this.revision(); const e = this.editor;
    if (kind === 'heading') return String(e?.getAttributes('heading')['level'] ?? 'p');
    if (!e) return this.normalize(kind, '');
    const { from, to, empty, $from } = e.state.selection;
    const values = new Set<string>();
    const read = (marks: typeof $from.marks extends () => infer R ? R : never, pos: number) => {
      const explicit = marks.find(mark => mark.type.name === 'textStyle')?.attrs[kind];
      const dom = e.view.domAtPos(pos).node;
      const element = dom instanceof Element ? dom : dom.parentElement;
      const computed = element ? getComputedStyle(element) : null;
      const inherited = kind === 'fontFamily' ? computed?.fontFamily : kind === 'fontSize' ? computed?.fontSize : kind === 'backgroundColor' ? computed?.backgroundColor : computed?.color;
      values.add(this.normalize(kind, String(explicit || inherited || '')));
    };
    if (empty) read(e.state.storedMarks ?? $from.marks(), from);
    else e.state.doc.nodesBetween(from, to, (node, pos) => { if (node.isText) read(node.marks, Math.max(from, pos)); });
    return values.size > 1 ? 'mixed' : [...values][0] ?? this.normalize(kind, '');
  }
  private normalize(kind: string, value: string): string {
    if (kind === 'backgroundColor') return safeHexColor(value) ?? 'none';
    if (!value) return kind === 'fontSize' ? '16px' : kind === 'fontFamily' ? 'Arial' : 'default';
    if (kind === 'fontSize') return ({ '0.875rem': '14px', '1rem': '16px', '1.125rem': '18px', '1.5rem': '24px', '2rem': '32px' } as Record<string, string>)[value] ?? value;
    if (kind === 'fontFamily') return value.startsWith('Georgia') ? 'Georgia' : value.startsWith('Arial') ? 'Arial' : value;
    if (kind === 'color') return ({ 'rgb(255, 133, 133)': '#ff8585', 'rgb(198, 40, 40)': '#ff8585', '#c62828': '#ff8585', 'rgb(169, 199, 255)': '#a9c7ff', 'rgb(156, 219, 177)': '#9cdbb1', 'rgb(255, 255, 255)': 'default', inherit: 'default' } as Record<string, string>)[value] ?? safeHexColor(value) ?? value;
    return value;
  }
  public run(key: string): void {
    if (!this.editor?.isEditable) return;
    const c = this.editor?.chain().focus(); if (!c) return;
    if (['left', 'center', 'right'].includes(key) && this.editor?.isActive('image')) {
      c.updateAttributes('image', { imageAlign: key }).run(); return;
    }
    switch (key) {
      case 'undo': c.undo().run(); break; case 'redo': c.redo().run(); break;
      case 'bold': c.toggleBold().run(); break; case 'italic': c.toggleItalic().run(); break;
      case 'underline': c.toggleUnderline().run(); break; case 'strike': c.toggleStrike().run(); break;
      case 'bulletList': c.toggleBulletList().run(); break; case 'orderedList': c.toggleOrderedList().run(); break;
      case 'left': case 'center': case 'right': c.setTextAlign(key).run(); break;
      case 'blockquote': c.toggleBlockquote().run(); break; case 'codeBlock': c.toggleCodeBlock().run(); break;
      case 'horizontalRule': c.setHorizontalRule().run(); break;
      case 'clear': c.unsetAllMarks().clearNodes().run(); break;
      case 'unlink': c.extendMarkRange('link').unsetLink().run(); break;
    }
  }
  public format(kind: string, value: string): void {
    if (!this.editor?.isEditable) return;
    const c = this.editor?.chain().focus(); if (!c) return;
    if (kind === 'heading') {
      if (value === 'p') c.setParagraph().run();
      else if (['2', '3', '4', '5', '6'].includes(value)) c.setHeading({ level: Number(value) as 2|3|4|5|6 }).run();
    }
    if (kind === 'fontFamily' && ['', 'Arial', 'Georgia', 'monospace'].includes(value)) value ? c.setFontFamily(value).run() : c.unsetFontFamily().run();
    if (kind === 'fontSize' && ['', '14px', '16px', '18px', '24px', '32px'].includes(value)) value ? c.setFontSize(value).run() : c.unsetFontSize().run();
    if (kind === 'color') {
      if (value === '' || value === 'default') c.unsetColor().run();
      else { const hex = safeHexColor(value); if (hex) c.setColor(hex).run(); }
    }
    if (kind === 'backgroundColor') {
      if (value === 'none') c.unsetBackgroundColor().run();
      else { const hex = safeHexColor(value); if (hex) c.setBackgroundColor(hex).run(); }
    }
  }
  public link(value: string): void {
    if (!this.editor?.isEditable) return;
    const href = legalHref(value.trim());
    if (!href) { this.message.set('Usa un enlace HTTPS o un correo válido.'); return; }
    this.editor?.chain().focus().extendMarkRange('link').setLink({ href }).run(); this.message.set('Enlace aplicado.');
  }
  public table(action: string): void {
    if (!this.editor?.isEditable) return;
    const c = this.editor?.chain().focus(); if (!c) return;
    if (action === 'insert') c.insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run();
    else if (action === 'row') c.addRowAfter().run();
    else if (action === 'column') c.addColumnAfter().run();
    else if (action === 'deleteRow') c.deleteRow().run();
    else if (action === 'deleteColumn') c.deleteColumn().run();
    else if (action === 'delete') c.deleteTable().run();
  }
}
