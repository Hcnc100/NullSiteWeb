import type { Email } from "../../models/Email";
import type { ToastrService } from "ngx-toastr";
import { Component, OnInit } from '@angular/core';
import type { EmailService } from "../services/email.service";
import type { FormBuilder} from "@angular/forms";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import type { ResizeService } from "src/app/services/resize/resize.service";
import type { Observable } from "rxjs";
import type { ErrorAndMessage } from "src/app/models/ErrorAndMessage";
import { CountAndErrorFieldComponent } from "../count-and-error-field/count-and-error-field.component";
import { RecaptchaFormsModule, RecaptchaModule } from "ng-recaptcha";
import { environment } from "src/environments/environment";

@Component({
  selector: 'app-form-contact',
  templateUrl: './form-contact.component.html',
  styleUrls: ['./form-contact.component.scss'],
  standalone: true,
  imports: [
    CountAndErrorFieldComponent,
    ReactiveFormsModule,
    RecaptchaModule,
    RecaptchaFormsModule
  ]
})
export class FormContactComponent {

  readonly maxCountName = 50;
  readonly maxCountSubject = 100;
  readonly maxCountEmail = 50;
  readonly maxCountMessage = 250;

  readonly errorsListName: ErrorAndMessage[] = [
    { error: "required", message: "Name is required" },
    { error: "minlength", message: "Name must be at least 3 characters" },
    { error: "maxlength", message: `Name must be less than ${this.maxCountName} characters` },
  ];

  readonly errorsListEmail: ErrorAndMessage[] = [
    { error: "required", message: "Email is required" },
    { error: "maxlength", message: `Email must be less than ${this.maxCountEmail} characters` },
    { error: "pattern", message: "Email is invalid" },
  ];

  readonly errorsListSubject: ErrorAndMessage[] = [
    { error: "required", message: "Subject is required" },
    { error: "maxlength", message: `Subject must be less than ${this.maxCountSubject} characters` },
  ];

  readonly errorsListMessage: ErrorAndMessage[] = [
    { error: "required", message: "Message is required" },
    { error: "maxlength", message: `Message must be less than ${this.maxCountMessage} characters` },
  ];



  isMobile: Observable<boolean>;



  readonly formContact = this.formBuilder.group({
    name: ['', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(this.maxCountName),
    ]],
    email: ['', [
      Validators.required,
      Validators.maxLength(this.maxCountEmail),
      Validators.pattern(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/)
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
  siteKey: string = environment.siteKey;

  get nameControl() {
    return this.formContact.controls['name'];
  }

  get emailControl() {
    return this.formContact.controls['email'];
  }

  get subjectControl() {
    return this.formContact.controls['subject'];
  }

  get messageControl() {
    return this.formContact.controls['message'];
  }

  constructor(
    private readonly toast: ToastrService,
    private readonly formBuilder: FormBuilder,
    private readonly emailService: EmailService,
    resizeServices: ResizeService
  ) {
    this.isMobile = resizeServices.isMobileSize;
  }

  async onSubmit() {
    this.formContact.markAllAsTouched();
    if (this.formContact.valid) {
      try {

        this.formContact.disable();

        await this.emailService.sendNewEmail(this.createEmailFromFrom());
        this.formContact.reset();

        this.toast.success('Email has been sent');
      } catch (e) {
        console.log("Error insert new email " + e);
        this.toast.error('Could not send email', "Error");
      } finally {
        this.formContact.enable();
      }
    } else {
      this.toast.error('Email is invalid', "Error");
    }
  }

  private createEmailFromFrom(): Email {
    return {
      name: this.nameControl!.value!,
      email: this.emailControl!.value!,
      subject: this.subjectControl!.value!,
      message: this.messageControl!.value!,
      isOpen: false,
    }
  }





}
