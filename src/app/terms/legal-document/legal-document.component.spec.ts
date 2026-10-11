import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { I18nService } from '../../i18n/i18n.service';
import { ResizeService } from '../../services/resize/resize.service';
import { LEGAL_HTML_LIMITS } from '../legal-html';
import { LegalDocumentComponent } from './legal-document.component';

describe('Legal document renderer', () => {
  const width = signal(1440);
  beforeEach(() => {
    width.set(1440);
    TestBed.configureTestingModule({ imports: [LegalDocumentComponent], providers: [provideRouter([]),
      { provide: ResizeService, useValue: { widthSize: width } }] });
    TestBed.inject(I18nService).setLocale('es');
  });

  it('uses one H1 and assigns only controlled anchors after Angular sanitization', async () => {
    const fixture = TestBed.createComponent(LegalDocumentComponent);
    fixture.componentRef.setInput('terms', { title: 'App', content: '<h1 id="main-content">Privacy</h1><h2>Contact</h2>' });
    fixture.detectChanges(); await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('h1').length).toBe(1);
    expect(root.querySelectorAll('.legal-document__content [id]').length).toBe(2);
    expect(root.querySelector('#legal-section-1')?.textContent).toBe('Privacy');
    expect(root.querySelector('#main-content')).toBeNull();
    const links = root.querySelectorAll<HTMLAnchorElement>('.legal-document__index a');
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toContain('#legal-section-1');
  });

  it('contains wide tables in a focusable region and keeps safe semantics', async () => {
    const fixture = TestBed.createComponent(LegalDocumentComponent);
    fixture.componentRef.setInput('terms', { title: 'App', content: '<table><caption>Data</caption>'
      + '<tr><th scope="col">Name</th><td>' + 'x'.repeat(300) + '</td></tr></table>' });
    fixture.nativeElement.style.cssText = 'display:block;width:260px';
    fixture.detectChanges(); await fixture.whenStable();
    const wrapper = fixture.nativeElement.querySelector('.legal-table-scroll') as HTMLElement;
    expect(wrapper.getAttribute('role')).toBe('region');
    expect(wrapper.getAttribute('tabindex')).toBe('0');
    expect(wrapper.getAttribute('aria-label')).toBe('Data');
    expect(wrapper.clientWidth).toBeLessThanOrEqual(260);
    expect(wrapper.scrollWidth).toBeGreaterThan(wrapper.clientWidth);
    expect(wrapper.querySelector('th')?.getAttribute('scope')).toBe('col');
  });

  it('uses mobile disclosure and updates safely when the document changes', async () => {
    const fixture = TestBed.createComponent(LegalDocumentComponent);
    fixture.componentRef.setInput('terms', { title: 'App', content: '<h2>First</h2><h2>Second</h2>' });
    fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('details').open).toBe(true);
    width.set(390); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('details').open).toBe(false);
    fixture.componentRef.setInput('terms', { title: 'Next', content: '<h2>Replacement</h2><p>New text</p>' });
    fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#legal-section-1').textContent).toBe('Replacement');
    expect(fixture.nativeElement.querySelector('#legal-section-2')).toBeNull();
    expect(fixture.nativeElement.querySelector('details')).toBeNull();
  });

  it('keeps safe formatting but removes CSS, events and active content at the rendered boundary', async () => {
    const fixture = TestBed.createComponent(LegalDocumentComponent);
    fixture.componentRef.setInput('terms', { title: '<script>Title</script>', content:
      '<h2>Policy</h2><p class="legal-note" style="position:fixed" onclick="alert(1)">Clause</p>'
      + '<img src="https://example.invalid/pixel"><style>body{display:none}</style>' });
    fixture.detectChanges(); await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toBe('<script>Title</script>');
    expect(root.querySelector('script,img,style,[onclick],[style]')).toBeNull();
    expect(root.querySelector('.legal-note')?.textContent).toBe('Clause');
  });

  it('reports rejected content without presenting a partial policy', () => {
    const fixture = TestBed.createComponent(LegalDocumentComponent);
    fixture.componentRef.setInput('terms', { title: 'App', content: 'x'.repeat(LEGAL_HTML_LIMITS.characters + 1) });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.legal-document__content')).toBeNull();
  });
});
