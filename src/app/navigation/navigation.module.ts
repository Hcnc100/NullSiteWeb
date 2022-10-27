import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLinkWithHref} from "@angular/router";
import {NavbarComponent} from './navbar/navbar.component';
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";


@NgModule({
  declarations: [
    NavbarComponent
  ],
  exports: [
    NavbarComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    RouterLinkWithHref
  ]
})
export class NavigationModule {
}
