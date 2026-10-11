import type { Email } from "../../models/Email";
import { ToastrService } from "ngx-toastr";
import { Component, effect, inject, signal, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import { ContactSubmissionError, EmailService } from "../services/email.service";
import { FormBuilder } from "@angular/forms";
import { ReactiveFormsModule, Validators } from "@angular/forms";
import { ResizeService } from "src/app/services/resize/resize.service";
import type { ErrorAndMessage } from "src/app/models/ErrorAndMessage";
import { CountAndErrorFieldComponent } from "../count-and-error-field/count-and-error-field.component";
import { environment } from "src/environments/environment";
import { NgxCaptchaModule } from 'ngx-captcha';
import type { ReCaptcha2Component } from 'ngx-captcha';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';


@Component({
  selector: 'app-form-contact',
  templateUrl: './form-contact.component.html',
  styleUrls: ['./form-contact.component.scss'],
  standalone: true,
  imports: [
    CountAndErrorFieldComponent,
    ReactiveFormsModule,
    NgxCaptchaModule, TranslatePipe
  ]
})
export class FormContactComponent {
  public readonly captcha = viewChild<ReCaptcha2Component>('captcha');
  public readonly i18n = inject(I18nService);
  public readonly isSending = signal(false);
  public readonly submissionError = signal('');
  public readonly sendingDialog = viewChild<ElementRef<HTMLDialogElement>>('sendingDialog');

  public readonly maxCountName = 50;
  public readonly maxCountSubject = 100;
  public readonly maxCountEmail = 50;
  public readonly maxCountMessage = 250;

  public readonly errorsListName: ErrorAndMessage[] = [
    { error: "required", message: "Name is required" },
    { error: "minlength", message: "Name must be at least 3 characters" },
    { error: "maxlength", message: `Name must be less than ${this.maxCountName} characters` },
  ];

  public readonly errorsListEmail: ErrorAndMessage[] = [
    { error: "required", message: "Email is required" },
    { error: "maxlength", message: `Email must be less than ${this.maxCountEmail} characters` },
    { error: "pattern", message: "Email is invalid" },
  ];

  public readonly errorsListSubject: ErrorAndMessage[] = [
    { error: "required", message: "Subject is required" },
    { error: "maxlength", message: `Subject must be less than ${this.maxCountSubject} characters` },
  ];

  public readonly errorsListMessage: ErrorAndMessage[] = [
    { error: "required", message: "Message is required" },
    { error: "maxlength", message: `Message must be less than ${this.maxCountMessage} characters` },
  ];





  private readonly toast: ToastrService = inject(ToastrService);
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly emailService: EmailService = inject(EmailService);
  private readonly resizeService: ResizeService = inject(ResizeService);
  private readonly analytics: Analytics = inject(Analytics);


  public readonly formContact = this.formBuilder.nonNullable.group({
    name: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(this.maxCountName),
    ]],
    email: ['', [
      Validators.required,
      Validators.maxLength(this.maxCountEmail),
      Validators.pattern(
        new RegExp(
          '^([a-zA-Z0-9_\\-\\.]+)@' +
          '((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|' +
          '(([a-zA-Z0-9\\-]+\\.)+))' +
          '([a-zA-Z]{2,4}|[0-9]{1,3})(\\]?)$'
        )
      )
    ]],
    subject: ['', [
      Validators.required,
      Validators.maxLength(this.maxCountSubject),
    ]],
    message: ['', [
      Validators.required,
      Validators.maxLength(this.maxCountMessage),
    ]],
    token: ['', Validators.required]
  });

  public siteKey: string = environment.siteKey;

  public constructor() {
    effect(() => {
      const dialog = this.sendingDialog()?.nativeElement;
      if (!dialog) return;
      if (this.isSending() && !dialog.open) dialog.showModal();
      else if (!this.isSending() && dialog.open) dialog.close();
    });
  }

  public preventSendingDismiss(event: Event): void { event.preventDefault(); }

  public async onSubmit(): Promise<void> {
    if (this.isSending() || this.formContact.disabled) return;
    this.submissionError.set('');
    this.formContact.markAllAsTouched();
    if (!this.formContact.valid) {
      this.toast.error(this.i18n.text('Email is invalid'), "Error");
      return;
    }

    // A signal also updates the pending UI in zoneless production builds.
    this.isSending.set(true);
    this.formContact.disable();

    try {
      await this.emailService.sendNewEmail(this.createEmailFromForm(), this.formContact.controls.token.value);
      this.toast.success(this.i18n.text('Email has been sent'));
      this.formContact.reset();
    } catch (error: unknown) {
      // Never send raw SDK errors, contact contents or credentials to analytics.
      try { logEvent(this.analytics, 'exception', { description: 'contact_send_failed', fatal: false }); }
      catch { /* Analytics must not interrupt error feedback or form recovery. */ }
      const message = error instanceof ContactSubmissionError && error.status === 400
        ? 'Review the fields and complete CAPTCHA again.'
        : error instanceof ContactSubmissionError && error.status === 429
          ? 'Too many attempts. Wait a few minutes before trying again.'
          : error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')
            ? 'The request timed out. Delivery could not be confirmed. Check before retrying.'
            : 'Could not send email';
      this.submissionError.set(message);
      this.toast.error(this.i18n.text(message), "Error");
    } finally {
      this.formContact.enable();
      // ngx-captcha's writeValue is a no-op: FormControl.reset alone does not reset the widget.
      try { const widget = this.captcha(); if (widget?.isLoaded === true) widget.resetCaptcha(); }
      catch { /* The external widget may have unloaded; still invalidate its token below. */ }
      // Tokens are single use, including failed or uncertain submissions.
      this.formContact.controls.token.reset('');
      this.isSending.set(false);
    }
  }


  private createEmailFromForm(): Email {
    return {
      name: this.formContact.controls.name.value,
      email: this.formContact.controls.email.value,
      subject: this.formContact.controls.subject.value,
      message: this.formContact.controls.message.value,
      isOpen: false,
    }
  }





}
