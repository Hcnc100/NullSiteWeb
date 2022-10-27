import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ShareModule} from "../share/share.module";
import {LightboxModule} from "ng-gallery/lightbox";
import {CertificateComponent} from './certificate/certificate.component';
import {ItemCertificateComponent} from './item-certificate/item-certificate.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";


@NgModule({
  declarations: [
    CertificateComponent,
    ItemCertificateComponent,
  ],
  imports: [
    CommonModule,
    ShareModule,
    LightboxModule.withConfig({
      panelClass: 'fullscreen'
    }),
    BrowserAnimationsModule
  ],
  exports: [
    CertificateComponent
  ]
})
export class CertificateModule {
}
