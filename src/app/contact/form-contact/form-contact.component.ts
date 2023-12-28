import { Email } from "../../models/Email";
import { ToastrService } from "ngx-toastr";
import { Component, OnInit } from '@angular/core';
import { EmailService } from "../services/email.service";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ResizeService } from "src/app/services/resize/resize.service";
import { Observable } from "rxjs";

@Component({
  selector: 'app-form-contact',
  templateUrl: './form-contact.component.html',
  styleUrls: ['./form-contact.component.scss']
})
export class FormContactComponent {

  readonly maxCountName = 50;
  readonly maxCountSubject = 100;
  readonly maxCountEmail = 50;
  readonly maxCountMessage = 250;


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

  get nameControl() {
    return this.formContact.controls['name'];
  }

  constructor(
    private toast: ToastrService,
    private formBuilder: FormBuilder,
    private emailService: EmailService,
    resizeServices: ResizeService
  ) {
    this.isMobile = resizeServices.isMobileSize;
  }

  // disableFieldsFrom() {
  //   Object.keys(this.formContact.controls).forEach(key => {
  //     this.formContact.controls[key].disable();
  //   });
  // }

  // enableFieldsForm() {
  //   Object.keys(this.formContact.controls).forEach(key => {
  //     this.formContact.controls[key].enable();
  //   });
  // }

  // resetForm() {
  //   Object.keys(this.formContact.controls).forEach(key => {
  //     this.formContact.controls[key].setValue("")
  //     this.formContact.controls[key].setErrors(null)
  //   });
  // }

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
      name: this.formContact.get('name')!.value!,
      email: this.formContact.get('email')!.value!,
      subject: this.formContact.get('subject')!.value!,
      message: this.formContact.get('message')!.value!,
      isOpen: false,
    }
  }





}
