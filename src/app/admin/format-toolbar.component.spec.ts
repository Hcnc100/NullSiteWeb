import { TestBed } from '@angular/core/testing';
import { FormatToolbarComponent } from './format-toolbar.component';
import { I18nService } from '../i18n/i18n.service';

describe('Readable format toolbar', () => {
  it('offers readable formatting controls without exposing HTML tag names', () => {
    const fixture = TestBed.createComponent(FormatToolbarComponent);
    TestBed.inject(I18nService).setLocale('es');
    const emitted: string[] = [];
    fixture.componentInstance.format.subscribe(value => emitted.push(value));
    fixture.detectChanges();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    expect(buttons.length).toBe(8);
    expect(buttons[0].textContent).toContain('Título de sección');
    buttons[0].click();
    expect(emitted).toEqual(['h2']);
    fixture.componentRef.setInput('disabled', true); fixture.detectChanges();
    expect(buttons.every(button => button.disabled)).toBe(true);
  });
});
