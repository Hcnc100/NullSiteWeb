import { Project } from "../../models/Project";
import { DialogRef } from '@ngneat/dialog';
import { Gallery, GalleryItem, ImageItem } from "ng-gallery";
import { faGithub, faGooglePlay } from "@fortawesome/free-brands-svg-icons";
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailsComponent {

  projectDetails: Project
  images: GalleryItem[];
  iconGit = faGithub;
  iconPlay = faGooglePlay;
  galleryId: string = "galleryProject"

  constructor(public ref: DialogRef<Project, boolean>, private gallery: Gallery) {
    this.projectDetails = ref.data
    this.images = this.projectDetails.gallery.map(urlImg =>
      new ImageItem({ src: urlImg, thumb: urlImg })
    );
    const galleryProject = gallery.ref(this.galleryId);
    galleryProject.load(this.images)
  }

}
