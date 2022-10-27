import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProfileComponent} from './profile/profile.component';
import {ImageProfileComponent} from './image-profile/image-profile.component';
import {ShareModule} from "../share/share.module";
import {PersonalLinksComponent} from './personal-links/personal-links.component';
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {DescriptionComponent} from './description/description.component';
import {EllipsisModule} from "ngx-ellipsis";
import {LottieComponent} from "ngx-lottie";


@NgModule({
  declarations: [
    ProfileComponent,
    ImageProfileComponent,
    PersonalLinksComponent,
    DescriptionComponent,
  ],
  exports: [
    ProfileComponent
  ],
  imports: [
    CommonModule,
    ShareModule,
    FontAwesomeModule,
    EllipsisModule,
    LottieComponent,
  ]
})
export class ProfileModule {
}
