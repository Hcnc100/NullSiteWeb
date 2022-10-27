import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ProjectsComponent} from './projects/projects.component';
import {CardProjectComponent} from './card-project/card-project.component';
import {DialogModule} from '@ngneat/dialog';
import {ProjectDetailsComponent} from './project-details/project-details.component';
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {GalleryModule} from 'ng-gallery';
import {ImgDetailsProjectComponent} from './img-details-project/img-details-project.component';
import {LightboxModule} from "ng-gallery/lightbox";
import {ShareModule} from "../share/share.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";


@NgModule({
  declarations: [
    ProjectsComponent,
    CardProjectComponent,
    ProjectDetailsComponent,
    ImgDetailsProjectComponent
  ],
  exports: [
    ProjectsComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    GalleryModule,
    DialogModule.forRoot(),
    LightboxModule,
    ShareModule,
    BrowserAnimationsModule
  ]
})
export class ProjectsModule {
}
