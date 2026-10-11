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
