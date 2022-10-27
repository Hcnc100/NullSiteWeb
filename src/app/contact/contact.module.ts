import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ContactComponent} from './contact/contact.component';
import {ImageContactComponent} from './image-contact/image-contact.component';
import {FormContactComponent} from './form-contact/form-contact.component';
import {RECAPTCHA_SETTINGS, RecaptchaFormsModule, RecaptchaModule, RecaptchaSettings} from 'ng-recaptcha';
import {ToastrModule} from 'ngx-toastr';
import {environment} from '../../environments/environment';
import {ReactiveFormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    ContactComponent,
    ImageContactComponent,
    FormContactComponent
  ],
  exports: [
    ContactComponent
  ],
  imports: [
    CommonModule,
    ToastrModule.forRoot(),
    RecaptchaFormsModule,
    ReactiveFormsModule,
    RecaptchaModule
  ],
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: {
        siteKey: environment.siteKey,
      } as RecaptchaSettings,
    },
  ]
})
export class ContactModule {
}
