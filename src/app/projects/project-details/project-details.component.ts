import type { Project } from "../../models/Project";
import type { DialogRef } from '@ngneat/dialog';
import type { Gallery, GalleryItem} from "ng-gallery";
import { GalleryModule, ImageItem } from "ng-gallery";
import { LightboxModule } from 'ng-gallery/lightbox';
import { faGithub, faGooglePlay } from "@fortawesome/free-brands-svg-icons";
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ImgDetailsProjectComponent } from "../img-details-project/img-details-project.component";

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FaIconComponent,
    ImgDetailsProjectComponent,
    GalleryModule,
    LightboxModule
  ]
})
export class ProjectDetailsComponent {

  projectDetails: Project
  images: GalleryItem[];
  iconGit = faGithub;
  iconPlay = faGooglePlay;
  galleryId: string = "galleryProject"

  constructor(public ref: DialogRef<Project, boolean>, private readonly gallery: Gallery) {
    this.projectDetails = ref.data
    this.images = this.projectDetails.gallery.map(urlImg =>
      new ImageItem({ src: urlImg, thumb: urlImg })
    );
    const galleryProject = gallery.ref(this.galleryId);
    galleryProject.load(this.images)
  }


  getImgUrl(src?: string | { url: string; type: string }[]): string | undefined {
    return typeof src === 'string' ? src : undefined;
  }
}
