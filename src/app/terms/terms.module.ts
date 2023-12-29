import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { TermsComponent } from './terms/terms.component';
import { ShareModule } from "../share/share.module";



@NgModule({
  declarations: [
    TermsComponent
  ],
  exports: [
    TermsComponent
  ],
  imports: [
    CommonModule,
    ShareModule
  ]
})
export class TermsModule { }
