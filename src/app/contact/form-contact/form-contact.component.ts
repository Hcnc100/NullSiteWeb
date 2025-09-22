import type { Email } from "../../models/Email";
import { ToastrService } from "ngx-toastr";
import { Component, inject } from '@angular/core';
import { EmailService } from "../services/email.service";
import { FormBuilder } from "@angular/forms";
import { ReactiveFormsModule, Validators } from "@angular/forms";
import { ResizeService } from "src/app/services/resize/resize.service";
import type { Observable } from "rxjs";
import type { ErrorAndMessage } from "src/app/models/ErrorAndMessage";
import { CountAndErrorFieldComponent } from "../count-and-error-field/count-and-error-field.component";
import { environment } from "src/environments/environment";
import { NgxCaptchaModule } from 'ngx-captcha';
import { Analytics, logEvent } from '@angular/fire/analytics';


@Component({
  selector: 'app-form-contact',
  templateUrl: './form-contact.component.html',
  styleUrls: ['./form-contact.component.scss'],
  standalone: true,
  imports: [
    CountAndErrorFieldComponent,
    ReactiveFormsModule,
    NgxCaptchaModule
  ]
})
export class FormContactComponent {

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



  public isMobile: Observable<boolean>;

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
    this.isMobile = this.resizeService.isMobileSize;
  }

  public async onSubmit(): Promise<void> {
    this.formContact.markAllAsTouched();
    if (!this.formContact.valid) {
      this.toast.error('Email is invalid', "Error");
      return;
    }

    this.formContact.disable();

    try {
      await this.emailService.sendNewEmail(this.createEmailFromForm());
      this.toast.success('Email has been sent');
      this.formContact.reset();
    } catch (e) {
      logEvent(this.analytics, 'exception', { description: (e as Error).message, fatal: false });
      this.toast.error('Could not send email', "Error");
    } finally {
      this.formContact.enable();
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
