import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { EditorLabComponent } from './editor-lab.component';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BlogComponent } from '../../blog/blog.component';
import { PublicBlogService } from '../../blog/public-blog.service';
import { SeoService } from '../../blog/seo.service';
import { By } from '@angular/platform-browser';
import { AngularEditorComponent } from '@kolkov/angular-editor';
import { TiptapToolbarComponent } from '../rich-editor/tiptap-toolbar.component';
import { LabImagesService, labImagePath } from './lab-images.service';
import { sanitizeLegalHtml } from '../../terms/legal-html';

describe('Editor library comparison: save, retrieve and public reader', () => {
  async function setup() {
    await TestBed.configureTestingModule({ imports: [EditorLabComponent], providers: [provideHttpClient()] }).compileComponents();
    const fixture = TestBed.createComponent(EditorLabComponent);
    fixture.detectChanges(); await fixture.whenStable();
    return fixture;
  }
  for (const library of ['tiptap', 'kolkov'] as const) {
    it(`${library}: persists HTML locally and renders recovered text in the real legal reader`, async () => {
      const fixture = await setup(); const c = fixture.componentInstance;
      c.selected.set(library); fixture.detectChanges(); await fixture.whenStable();
      const expected = c.snapshot().html; c.saveLocal();
      c.saved.set(null); c.recoverLocal(); fixture.detectChanges(); await fixture.whenStable();
      expect(c.saved()?.html).toBe(expected);
      const reader = fixture.nativeElement.querySelector('app-legal-document');
      expect(reader.textContent).toContain('Prueba de encabezado');
      expect(reader.textContent).toContain('Texto rojo grande');
      expect(reader.querySelector('strong').textContent).toBe('negrita');
      expect(reader.querySelector('script')).toBeNull();
      expect(reader.querySelector('[style]')).toBeNull();
      const rich = reader.querySelector('.rt-size-large') as HTMLElement;
      expect(rich).toBeTruthy();
      expect(getComputedStyle(rich).fontSize).toBe('24px');
      expect(getComputedStyle(rich).color).toBe('rgb(255, 133, 133)');
      expect(getComputedStyle(rich).fontFamily).toContain('Georgia');
      expect(c.blogResult()).toContain('Texto rojo grande');
      expect(c.blogResult()).not.toContain('font-size');
    });
  }
  it('Tiptap retains headings, table and typography in editor HTML before public sanitization', async () => {
    const fixture = await setup(); const c = fixture.componentInstance;
    expect(c.editor?.getHTML()).toContain('<table');
    expect(c.editor?.getHTML()).toContain('font-size: 24px');
    expect(c.editor?.getHTML()).toContain('font-family: Georgia');
    expect(c.editor?.getHTML()).toContain('<h3>');
    c.editor?.commands.selectAll(); c.editor?.chain().setColor('#c62828').setFontSize('24px').run();
    expect(c.editor?.getHTML()).toContain('color:');
    c.saveLocal(); c.recoverLocal(); expect(c.saved()?.html).toContain('rt-size-large');
    c.reopen(); expect(c.editor?.getHTML()).toContain('font-size: 1.5rem');
  });
  it('Tiptap icon toolbar formats selected text and persists its safe presentation', async () => {
    const fixture = await setup(); fixture.detectChanges();
    const c = fixture.componentInstance;
    const toolbar = fixture.debugElement.query(By.directive(TiptapToolbarComponent)).componentInstance as TiptapToolbarComponent;
    c.editor!.commands.selectAll();
    (fixture.nativeElement.querySelector('app-tiptap-toolbar button[aria-label="Subrayado"]') as HTMLButtonElement).click();
    toolbar.format('fontFamily', 'Georgia'); toolbar.format('fontSize', '24px'); toolbar.format('color', '#ff8585');
    expect(c.editor!.getHTML()).toContain('<u>');
    c.saveLocal(); c.recoverLocal(); c.reopen();
    expect(c.saved()!.html).toContain('rt-size-large');
    expect(c.saved()!.html).toContain('rt-font-serif');
    expect(c.saved()!.html).toContain('rt-color-red');
    expect(c.saved()!.html).not.toContain('style=');
    expect(c.editor!.getHTML()).toContain('<u>');
    toolbar.link('javascript:alert(1)');
    expect(toolbar.message()).toContain('HTTPS');
    expect(c.editor!.getHTML()).not.toContain('javascript:');
  });
  it('Tiptap selectors follow the selection, show mixed formats and fall back to concrete defaults', async () => {
    const fixture = await setup(); fixture.detectChanges();
    const e = fixture.componentInstance.editor!;
    const toolbar = fixture.debugElement.query(By.directive(TiptapToolbarComponent)).componentInstance as TiptapToolbarComponent;
    e.commands.setContent('<p>Simple <span style="font-family: Georgia; font-size: 24px; color: #ff8585">Rojo</span></p>');
    e.commands.setTextSelection({ from: 8, to: 12 });
    expect(toolbar.value('fontFamily')).toBe('Georgia');
    expect(toolbar.value('fontSize')).toBe('24px');
    expect(toolbar.value('color')).toBe('#ff8585');
    e.commands.selectAll(); expect(toolbar.value('fontSize')).toBe('mixed');
    e.commands.setContent('<p></p>'); e.commands.setTextSelection(1);
    expect(toolbar.value('fontFamily')).toBe('Arial');
    expect(toolbar.value('fontSize')).toBe('16px');
    expect(toolbar.value('color')).toBe('default');
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('select[aria-label="Tamaño de fuente"]') as HTMLSelectElement).value).toBe('16px');
    expect(fixture.nativeElement.querySelector('.link-group [aria-label="Quitar enlace"]')).toBeTruthy();
  });
  it('Tiptap quotes are distinct and its native color input preserves arbitrary hex across readers and reopening', async () => {
    const fixture = await setup(); fixture.detectChanges();
    const e = fixture.componentInstance.editor!;
    e.commands.setContent('<p>Cita visible</p>'); e.commands.selectAll();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('[aria-label="Cita"]') as HTMLButtonElement).click();
    const quote = root.querySelector('.tiptap blockquote')!;
    expect(getComputedStyle(quote).borderInlineStartWidth).toBe('3px');
    expect(getComputedStyle(quote).paddingInlineStart).toBe('20px');
    const picker = root.querySelector('input[type="color"]') as HTMLInputElement;
    picker.value = '#b438c2'; picker.dispatchEvent(new Event('input')); fixture.detectChanges();
    expect(getComputedStyle(root.querySelector('.tiptap span')!).color).toBe('rgb(180, 56, 194)');
    expect(root.querySelector('.color-trigger')!.getAttribute('title')).toContain('#b438c2');
    const c = fixture.componentInstance; c.saveLocal(); c.recoverLocal(); fixture.detectChanges(); await fixture.whenStable();
    expect(c.saved()!.html).toContain('<blockquote>');
    expect(c.saved()!.html).toContain('rt-color-hex-b438c2');
    expect(c.saved()!.html).not.toContain('style=');
    for (const selector of ['app-legal-document .rt-color-hex-b438c2', '.blog-body .rt-color-hex-b438c2']) {
      expect(getComputedStyle(root.querySelector(selector)!).color).toBe('rgb(180, 56, 194)');
    }
    c.reopen(); expect(c.editor!.getHTML()).toContain('rgb(180, 56, 194)');
    expect(getComputedStyle(root.querySelector('.tiptap')!).outlineStyle).toBe('none');
  });
  it('keeps foreground and background separate and recovers both in readers', async () => {
    const fixture = await setup(); fixture.detectChanges();
    const c = fixture.componentInstance; c.editor!.commands.setContent('<p>Colores</p>'); c.editor!.commands.selectAll();
    const toolbar = fixture.debugElement.query(By.directive(TiptapToolbarComponent)).componentInstance as TiptapToolbarComponent;
    toolbar.format('color', '#123456'); toolbar.format('backgroundColor', '#fedcba');
    expect(toolbar.value('color')).toBe('#123456'); expect(toolbar.value('backgroundColor')).toBe('#fedcba');
    c.saveLocal(); c.recoverLocal(); fixture.detectChanges(); await fixture.whenStable();
    const html = c.saved()!.html; expect(html).toContain('rt-color-hex-123456'); expect(html).toContain('rt-background-hex-fedcba');
    const rich = fixture.nativeElement.querySelector('app-legal-document .rt-background-hex-fedcba');
    expect(getComputedStyle(rich).backgroundColor).toBe('rgb(254, 220, 186)');
    c.reopen(); expect(c.editor!.getHTML()).toContain('background-color:');
    toolbar.format('backgroundColor', 'none'); expect(toolbar.value('color')).toBe('#123456');
    expect(c.editor!.getHTML()).not.toContain('background-color:');
  });
  it('inserts a private Firebase image reference and restores it without persisting a blob URL', async () => {
    const fixture = await setup(); const c = fixture.componentInstance;
    const images = fixture.debugElement.injector.get(LabImagesService);
    const path = 'blog-drafts/editor-lab/test.png';
    vi.spyOn(images, 'upload').mockResolvedValue(path);
    vi.spyOn(images, 'image').mockResolvedValue('blob:test-only');
    c.editor!.commands.setContent('<p>Imagen</p>');
    await c.uploadImage(new File(['fake'], 'test.png', { type: 'image/png' }), 'Descripción de prueba');
    c.saveLocal(); c.recoverLocal(); fixture.detectChanges(); await fixture.whenStable();
    expect(c.saved()!.html).toContain('data-image-path="' + path + '"');
    expect(c.saved()!.html).not.toContain('blob:');
    expect(fixture.nativeElement.querySelector('app-legal-document img')?.alt).toBe('Descripción de prueba');
    expect(fixture.nativeElement.querySelector('app-legal-document img')?.getAttribute('src')).toBe('blob:test-only');
    expect(fixture.nativeElement.querySelector('.blog-body img')?.getAttribute('src')).toBe('blob:test-only');
    c.reopen(); expect(c.editor!.getHTML()).toContain(path);
    expect(sanitizeLegalHtml(c.saved()!.html, document).html).not.toContain('<img');
    expect(sanitizeLegalHtml('<img src="https://bad.test/x.png">Text', document, 'legal', labImagePath).html).not.toContain('<img');
  });
  it('keeps pasted image bytes in memory until save and preserves centering after reopen', async () => {
    const fixture = await setup(); const c = fixture.componentInstance;
    const images = fixture.debugElement.injector.get(LabImagesService);
    const upload = vi.spyOn(images, 'upload').mockResolvedValue('blog-drafts/editor-lab/pasted.png');
    vi.spyOn(images, 'stage').mockResolvedValue('blog-drafts/editor-lab/pending-pasted.png');
    const persist = vi.spyOn(images, 'persistHtml').mockImplementation(async html => html.replaceAll('pending-pasted.png', 'pasted.png'));
    vi.spyOn(images, 'image').mockResolvedValue('blob:test-only');
    const data = new DataTransfer(); data.items.add(new File(['fake'], 'paste.png', { type: 'image/png' }));
    const event = new ClipboardEvent('paste', { clipboardData: data, cancelable: true });
    expect(c.pasteImage(event)).toBe(true); expect(event.defaultPrevented).toBe(true);
    await fixture.whenStable(); fixture.detectChanges();
    expect(upload).not.toHaveBeenCalled(); expect(c.editor!.getHTML()).toContain('pending-pasted.png');
    let pos = 0; c.editor!.state.doc.descendants((node, position) => { if (node.type.name === 'image') pos = position; });
    c.editor!.commands.setNodeSelection(pos);
    const toolbar = fixture.debugElement.query(By.directive(TiptapToolbarComponent)).componentInstance as TiptapToolbarComponent;
    toolbar.run('center'); expect(toolbar.active('center')).toBe(true);
    await c.saveLocal(); c.recoverLocal(); expect(c.saved()!.html).toContain('rt-image-center');
    expect(persist).toHaveBeenCalled(); expect(c.saved()!.html).not.toContain('pending-pasted.png');
    c.reopen(); expect(c.editor!.getHTML()).toContain('rt-image-center');
    const plain = new ClipboardEvent('paste', { clipboardData: new DataTransfer() });
    expect(c.pasteImage(plain)).toBe(false);
  });
  it('imports an image link through upload and provides two independent color menus', async () => {
    const fixture = await setup(); fixture.detectChanges(); const c = fixture.componentInstance;
    const images = fixture.debugElement.injector.get(LabImagesService);
    const file = new File(['fake'], 'url.png', { type: 'image/png' });
    vi.spyOn(images, 'fromUrl').mockResolvedValue(file);
    vi.spyOn(images, 'upload').mockResolvedValue('blog-drafts/editor-lab/url.png');
    vi.spyOn(images, 'image').mockResolvedValue('blob:test-only');
    await c.insertImageUrl('https://example.com/image.png', 'Imagen del enlace');
    expect(images.fromUrl).toHaveBeenCalledWith('https://example.com/image.png');
    expect(images.upload).toHaveBeenCalledWith(file);
    const toolbar = fixture.debugElement.query(By.directive(TiptapToolbarComponent)).componentInstance as TiptapToolbarComponent;
    c.editor!.commands.setContent('<p>Texto</p>'); c.editor!.commands.selectAll();
    toolbar.format('color', '#123456'); toolbar.format('backgroundColor', '#fedcba');
    toolbar.format('color', 'default'); expect(toolbar.value('backgroundColor')).toBe('#fedcba');
    expect(fixture.nativeElement.querySelectorAll('app-tiptap-toolbar summary.color-trigger').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('app-tiptap-toolbar .toolbar > button[aria-label="Quitar fondo del texto"]').length).toBe(0);
  });
  it('icon dropdowns retain accessible names and independent reset actions', async () => {
    const fixture = await setup(); fixture.detectChanges(); const root = fixture.nativeElement as HTMLElement;
    const c = fixture.componentInstance; c.editor!.commands.setContent('<p>Colores</p>'); c.editor!.commands.selectAll();
    const toolbar = fixture.debugElement.query(By.directive(TiptapToolbarComponent)).componentInstance as TiptapToolbarComponent;
    toolbar.format('color', '#123456'); toolbar.format('backgroundColor', '#fedcba');
    const trigger = root.querySelector('summary[aria-label="Color de texto"]') as HTMLElement;
    trigger.click(); expect((trigger.parentElement as HTMLDetailsElement).open).toBe(true);
    const menu = trigger.parentElement!.querySelectorAll('button');
    expect(menu[0].getAttribute('aria-label')).toBe('Elegir color de texto');
    menu[1].click(); expect(toolbar.value('backgroundColor')).toBe('#fedcba');
    expect((trigger.parentElement as HTMLDetailsElement).open).toBe(false);
    for (const button of Array.from(root.querySelectorAll('.icon-menu button'))) {
      expect(button.getAttribute('aria-label')).toBeTruthy(); expect(button.getAttribute('title')).toBeTruthy();
      expect(button.querySelector('fa-icon')).toBeTruthy();
    }
  });
  it('keeps only one dropdown open and closes on outside click or Escape', async () => {
    const fixture = await setup(); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const summaries = Array.from(root.querySelectorAll<HTMLElement>('app-tiptap-toolbar summary'));
    expect(summaries.length).toBe(4);
    for (const summary of summaries) {
      summary.click();
      expect(root.querySelectorAll('app-tiptap-toolbar details[open]').length).toBe(1);
      expect((summary.parentElement as HTMLDetailsElement).open).toBe(true);
    }
    const input = root.querySelector('.link-editor input') as HTMLInputElement;
    summaries[2].click(); input.click();
    expect((summaries[2].parentElement as HTMLDetailsElement).open).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(root.querySelectorAll('app-tiptap-toolbar details[open]').length).toBe(0);
    expect(document.activeElement).toBe(summaries[2]);
    summaries[3].click(); root.querySelector<HTMLElement>('h1')!.click();
    expect(root.querySelectorAll('app-tiptap-toolbar details[open]').length).toBe(0);
  });
  it('keeps visible labels for table actions while other dropdowns remain icon-only', async () => {
    const fixture = await setup(); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    for (const action of ['Insertar tabla', 'Añadir fila', 'Añadir columna', 'Eliminar fila', 'Eliminar columna', 'Eliminar tabla']) {
      expect(root.querySelector(`.table-menu button[aria-label="${action}"]`)!.textContent).toContain(action);
    }
    expect(root.querySelector('summary[aria-label="Opciones de tabla"]')!.textContent).toContain('Tabla');
    for (const button of Array.from(root.querySelectorAll('.icon-menu button'))) expect(button.textContent?.trim()).toBe('');
  });
  it('Tiptap toolbar inserts, extends and removes tables', async () => {
    const fixture = await setup(); fixture.detectChanges();
    const c = fixture.componentInstance;
    const toolbar = fixture.debugElement.query(By.directive(TiptapToolbarComponent)).componentInstance as TiptapToolbarComponent;
    c.editor!.commands.setContent('<p>Tabla</p>'); c.editor!.commands.setTextSelection(1);
    toolbar.table('insert'); expect(c.editor!.getHTML().match(/<tr>/g)?.length).toBe(3);
    toolbar.table('row'); expect(c.editor!.getHTML().match(/<tr>/g)?.length).toBe(4);
    toolbar.table('column'); c.saveLocal(); c.recoverLocal();
    expect(c.saved()!.html).toContain('<table');
    toolbar.table('delete'); expect(c.editor!.getHTML()).not.toContain('<table');
  });
  it('Kolkov mounts its toolbar and supports multiple headings in the same document', async () => {
    const fixture = await setup(); const c = fixture.componentInstance;
    c.selected.set('kolkov'); fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('angular-editor-toolbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.angular-editor-textarea').textContent).toContain('Prueba de encabezado');
    expect(c.currentHtml()).toContain('<h2>'); expect(c.currentHtml()).toContain('<h3>');
    // Our closed sanitizer preserves typography as classes, without preserving CSS.
    expect(fixture.nativeElement.querySelector('.angular-editor-textarea span[style*="font-size"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.angular-editor-textarea .rt-size-large')).toBeTruthy();
  });
  it('Kolkov keeps dropdown arrows, list markers and table borders readable in the dark theme', async () => {
    const fixture = await setup(); fixture.componentInstance.selected.set('kolkov');
    fixture.detectChanges(); await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const label = root.querySelector('.ae-picker-label')!;
    expect(getComputedStyle(label, '::before').backgroundColor).toBe('rgb(52, 52, 59)');
    const list = root.querySelector('.angular-editor-textarea ul')!;
    expect(getComputedStyle(list).listStyleType).toBe('disc');
    expect(parseFloat(getComputedStyle(list).paddingInlineStart)).toBeGreaterThan(0);
    const cell = root.querySelector('.angular-editor-textarea td')!;
    expect(getComputedStyle(cell).borderTopStyle).toBe('solid');
    expect(getComputedStyle(cell).borderTopWidth).toBe('1px');
    const c = fixture.componentInstance; c.saveLocal(); c.recoverLocal(); c.reopen();
    fixture.detectChanges(); await fixture.whenStable();
    expect(c.currentHtml()).toContain('<table');
    expect(c.currentHtml()).toContain('<li>Uno</li>');
  });
  it('Kolkov formatting commands update the saved HTML, not just the visible DOM', async () => {
    const fixture = await setup(); const c = fixture.componentInstance; c.selected.set('kolkov'); fixture.detectChanges();
    const area = fixture.nativeElement.querySelector('.angular-editor-textarea') as HTMLElement;
    area.focus(); const range = document.createRange(); range.selectNodeContents(area);
    const selection = window.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
    const kolkov = fixture.debugElement.query(By.directive(AngularEditorComponent)).componentInstance as AngularEditorComponent;
    const before = c.currentHtml();
    kolkov.executeCommandFn('foreColor', '#c62828');
    fixture.detectChanges(); await fixture.whenStable();
    c.saveLocal(); c.recoverLocal();
    expect(c.saved()?.html).not.toBe(before);
    expect(c.saved()?.html).toContain('rt-color-red');
    expect(c.saved()?.html).not.toContain('style=');
    expect(c.saved()?.html).toContain('Texto rojo grande');
    selection.removeAllRanges();
  });
  it('recovers safely even if a stored local document contains executable markup', async () => {
    const fixture = await setup(); const c = fixture.componentInstance;
    c.kolkovHtml = '<p>Visible</p><script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)">';
    c.selected.set('kolkov'); c.saveLocal(); c.recoverLocal(); fixture.detectChanges(); await fixture.whenStable();
    const reader = fixture.nativeElement.querySelector('app-legal-document');
    expect(reader.textContent).toContain('Visible');
    expect(reader.querySelector('script,img')).toBeNull();
  });
  it('rejects invalid stored records', async () => {
    const fixture = await setup(); localStorage.setItem('nullsite-editor-lab-v1', JSON.stringify({ html: 123 }));
    fixture.componentInstance.recoverLocal(); expect(fixture.componentInstance.saved()).toBeNull();
  });
  for (const library of ['tiptap', 'kolkov'] as const) {
    it(`${library}: recovered HTML is visible through the actual public BlogComponent`, async () => {
      const fixture = await setup(); const c = fixture.componentInstance;
      c.selected.set(library); c.saveLocal(); c.recoverLocal(); const html = c.saved()!.html;
      fixture.destroy(); TestBed.resetTestingModule();
      const params = convertToParamMap({ slug: 'lab' });
      TestBed.configureTestingModule({ imports: [BlogComponent], providers: [provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(params), snapshot: { paramMap: params } } },
        { provide: SeoService, useValue: { setPage: () => undefined } },
        { provide: PublicBlogService, useValue: { enabled: signal(true), ready: signal(true), error: signal(false),
          post: (_locale: string, _slug: string, next: (value: unknown) => void) => {
            next({ id: 'es-lab', title: 'Recuperado', excerpt: '', tags: [], contentHtml: html, assetVersion: 'v1' }); return () => undefined;
          } } },
      ] });
      const reader = TestBed.createComponent(BlogComponent); reader.detectChanges(); await reader.whenStable(); reader.detectChanges();
      expect(reader.nativeElement.querySelector('.blog-body').textContent).toContain('Texto rojo grande');
      expect(reader.nativeElement.querySelector('.blog-body h2').textContent).toBe('Prueba de encabezado');
      expect(reader.nativeElement.querySelector('.blog-body [style]')).toBeNull();
      expect(getComputedStyle(reader.nativeElement.querySelector('.blog-body .rt-size-large')).fontSize).toBe('24px');
    });
  }
  if ((import.meta as ImportMeta & { env: Record<string, string> }).env['VITE_EDITOR_EMULATOR'] === '1') {
    for (const library of ['tiptap', 'kolkov'] as const) {
      it(`${library}: actual Firestore emulator round trip renders recovered text`, async () => {
        const fixture = await setup(); const c = fixture.componentInstance; c.selected.set(library);
        const html = c.snapshot().html; await c.firestore(true);
        expect(c.status()).toContain('Guardado en Firestore EMULADO');
        c.saved.set(null); await c.firestore(false);
        expect(c.saved()?.html).toBe(html);
        fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('app-legal-document').textContent).toContain('Texto rojo grande');
      });
    }
  }
});
