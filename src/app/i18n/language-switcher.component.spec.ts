import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('Language switcher overlay hierarchy', () => {
  it('stays below CDK modal overlays so it cannot visually cover the close button on mobile', () => {
    TestBed.configureTestingModule({ imports: [LanguageSwitcherComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(LanguageSwitcherComponent); fixture.detectChanges();
    const nav: HTMLElement = fixture.nativeElement.querySelector('.languages');
    expect(Number(getComputedStyle(nav).zIndex)).toBeLessThan(1000);
  });
});
