import { vi } from 'vitest';
import type { Mock } from 'vitest';
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { TermsComponent } from './terms.component';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import type { Terms } from '../../models/Terms';
import { TermsService } from '../terms.service';
import { I18nService } from '../../i18n/i18n.service';
import { Component, input } from '@angular/core';
import { LoadingComponent } from '../../share/loading/loading.component';

@Component({ selector: 'app-loading', standalone: true, template: '<p role="status">Loading</p>' })
class LoadingStubComponent { public readonly pathArg = input(''); }

describe('TermsComponent', () => {
  let component: TermsComponent;
  let fixture: ComponentFixture<TermsComponent>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let getTerms: Mock;

  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({ projectID: 'test' }));
    getTerms = vi.fn().mockName('getTerms').mockReturnValue(of({ title: 'App', content: '<h2>Safe heading</h2>' }));
    await TestBed.configureTestingModule({
      imports: [TermsComponent],
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { paramMap: params } },
        { provide: TermsService, useValue: { getTerms } }]
    })
    .overrideComponent(TermsComponent, { remove: { imports: [LoadingComponent] }, add: { imports: [LoadingStubComponent] } })
    .compileComponents();

    fixture = TestBed.createComponent(TermsComponent);
    component = fixture.componentInstance;
    TestBed.inject(I18nService).setLocale('es');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders through the shared safe document component', () => {
    getTerms.mockReturnValue(of({ title: 'Terms', content: '<h2>Safe heading</h2><img src="x" onerror="alert(1)"><script>alert(1)</script>' }));
    fixture.detectChanges();
    const content: HTMLElement = fixture.nativeElement.querySelector('.legal-document__content');
    expect(content.querySelector('h2')?.textContent).toBe('Safe heading');
    expect(content.querySelector('script')).toBeNull();
    expect(content.querySelector('img')).toBeNull();
  });

  it('finishes loading on a live snapshot without waiting for stream completion', () => {
    const stream = new Subject<Terms | null>();
    getTerms.mockReturnValue(stream);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
    stream.next({ title: 'Live policy', content: '<p>Clause</p>' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Live policy');
  });

  it('distinguishes a missing document from a network failure and supports retry', () => {
    getTerms.mockReturnValue(throwError(() => new Error('network unavailable')));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).not.toContain('404');
    getTerms.mockReturnValue(of({ title: 'Recovered', content: '<p>Full document</p>' }));
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Recovered');
    expect(getTerms.mock.calls.length).toBe(2);
  });

  it('also contains synchronous SDK failures instead of breaking the page', () => {
    getTerms.mockImplementation(() => { throw new Error('SDK initialization failure'); });
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
  });

  it('shows not-found for absent documents and clears stale content on route changes', () => {
    fixture.detectChanges();
    getTerms.mockReturnValue(of(null));
    params.next(convertToParamMap({ projectID: 'missing' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('404');
    expect(fixture.nativeElement.querySelector('app-legal-document')).toBeNull();
  });

  it('does not request a Firestore path for invalid route IDs', () => {
    params.next(convertToParamMap({ projectID: '../other' }));
    fixture.detectChanges();
    expect(getTerms).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('404');
  });

  it('cancels the previous subscription and never shows stale legal text while loading another ID', () => {
    const first = new Subject<Terms | null>();
    const second = new Subject<Terms | null>();
    getTerms.mockReturnValue(first);
    fixture.detectChanges();
    first.next({ title: 'First', content: '<p>First policy</p>' });
    fixture.detectChanges();
    getTerms.mockReturnValue(second);
    params.next(convertToParamMap({ projectID: 'next' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-legal-document')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
    first.next({ title: 'Stale', content: '<p>Wrong policy</p>' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Wrong policy');
    second.next({ title: 'Second', content: '<p>Second policy</p>' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Second');
  });
});






