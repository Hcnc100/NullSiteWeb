import { vi } from 'vitest';
import type { Mock } from 'vitest';
import { Component, forwardRef, input } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { Analytics } from '@angular/fire/analytics';
import { NgxCaptchaModule } from 'ngx-captcha';
import { ToastrService } from 'ngx-toastr';
import { ContactSubmissionError, EmailService } from '../services/email.service';
import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {FormContactComponent} from './form-contact.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- Replace the external widget without network access.
  selector: 'ngx-recaptcha2', standalone: true, template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CaptchaStubComponent), multi: true }],
})
class CaptchaStubComponent implements ControlValueAccessor {
  public readonly isLoaded = true;
  public readonly resetCaptcha = vi.fn().mockName('resetCaptcha');
  public readonly siteKey = input('');
  public readonly hl = input('es');
  public readonly size = input('compact');
  public writeValue(): void { /* Test widget intentionally does not load reCAPTCHA. */ }
  public registerOnChange(): void { /* No interaction needed in these layout tests. */ }
  public registerOnTouched(): void { /* No interaction needed in these layout tests. */ }
}

describe('FormContactComponent', () => {
  let component: FormContactComponent;
  let fixture: ComponentFixture<FormContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormContactComponent],
      providers: [provideRouter([]), { provide: Analytics, useValue: {} },
        { provide: ToastrService, useValue: {
          success: vi.fn().mockName('success'), error: vi.fn().mockName('error') } },
        { provide: EmailService, useValue: { sendNewEmail: vi.fn().mockName('sendNewEmail') } }]
    })
      .overrideComponent(FormContactComponent, {
        remove: { imports: [NgxCaptchaModule] }, add: { imports: [CaptchaStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FormContactComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes verification to backend, blocks duplicate submit and clears the used token', async () => {
    fixture.detectChanges();
    let complete!: () => void;
    const sender = TestBed.inject(EmailService).sendNewEmail as Mock;
    sender.mockReturnValue(new Promise<void>(resolve => { complete = resolve; }));
    component.formContact.setValue({ name: 'Visitor', email: 'visitor@example.com', subject: 'Hello',
      message: 'Message', token: 'captcha-token' });
    const sending = component.onSubmit();
    expect(component.formContact.disabled).toBe(true);
    fixture.detectChanges();
    expect(component.isSending()).toBe(true);
    expect(fixture.nativeElement.querySelector('form').getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('fieldset').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('input[type=submit]').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('[role=status]').textContent).toBeTruthy();
    await component.onSubmit();
    expect(sender).toHaveBeenCalledTimes(1);
    expect(sender.mock.calls.at(-1)![1]).toBe('captcha-token');
    complete(); await sending;
    expect(component.formContact.enabled).toBe(true);
    expect(component.isSending()).toBe(false);
    expect(component.formContact.controls.token.value).toBe('');
    expect(component.captcha()?.resetCaptcha).toHaveBeenCalled();
  });

  it('unlocks after rejection, preserves the message and announces safe feedback', async () => {
    fixture.detectChanges();
    component.i18n.setLocale('es');
    const sender = TestBed.inject(EmailService).sendNewEmail as Mock;
    sender.mockRejectedValue(new ContactSubmissionError(400));
    component.formContact.setValue({ name: 'Visitor', email: 'visitor@example.com', subject: 'Hello',
      message: 'Keep me', token: 'used-token' });
    await component.onSubmit();
    fixture.detectChanges();
    expect(component.isSending()).toBe(false);
    expect(component.formContact.enabled).toBe(true);
    expect(component.formContact.controls.message.value).toBe('Keep me');
    expect(component.formContact.controls.token.value).toBe('');
    expect(fixture.nativeElement.querySelector('[role=alert]').textContent).toContain('CAPTCHA');
    expect(fixture.nativeElement.querySelector('form').getAttribute('aria-busy')).toBe('false');
    expect(component.captcha()?.resetCaptcha).toHaveBeenCalled();
  });

  it('reports rate limits and uncertain timeout without pretending delivery failed for certain', async () => {
    fixture.detectChanges();
    const sender = TestBed.inject(EmailService).sendNewEmail as Mock;
    for (const [error, expected] of [[new ContactSubmissionError(429), 'Too many attempts'],
      [new DOMException('Timed out', 'TimeoutError'), 'Delivery could not be confirmed']] as const) {
      component.formContact.setValue({ name: 'Visitor', email: 'visitor@example.com', subject: 'Hello',
        message: 'Keep me', token: 'new-token' });
      sender.mockRejectedValue(error);
      await component.onSubmit();
      expect(component.submissionError()).toContain(expected);
      expect(component.isSending()).toBe(false);
    }
  });

  it('associates persistent labels, help and invalid states with every field', () => {
    fixture.detectChanges();
    const fields = fixture.nativeElement.querySelectorAll('input:not([type=submit]), textarea') as
      NodeListOf<HTMLInputElement>;
    expect(fields.length).toBe(4);
    fields.forEach(field => {
      expect(fixture.nativeElement.querySelector(`label[for="${field.id}"]`)).toBeTruthy();
      expect(fixture.nativeElement.querySelector(`#${field.getAttribute('aria-describedby')}`)).toBeTruthy();
      expect(field.getAttribute('aria-invalid')).toBe('false');
    });
    expect(fixture.nativeElement.querySelector('#contact-name').autocomplete).toBe('name');
    expect(fixture.nativeElement.querySelector('#contact-email').autocomplete).toBe('email');
    component.formContact.markAllAsTouched();
    fixture.detectChanges();
    fields.forEach(field => expect(field.getAttribute('aria-invalid')).toBe('true'));
    expect(fixture.nativeElement.querySelector('#contact-name-help').textContent).toContain('0/50');
    expect(TestBed.inject(EmailService).sendNewEmail).not.toHaveBeenCalled();
  });
});






