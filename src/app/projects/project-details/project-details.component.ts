import type { Project } from "../../models/Project";
import { DialogRef } from '@ngneat/dialog';
import { Gallery, GalleryItem } from "ng-gallery";
import { GalleryModule, ImageItem } from "ng-gallery";
import { LightboxModule } from 'ng-gallery/lightbox';
import { faGithub, faGooglePlay } from "@fortawesome/free-brands-svg-icons";
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
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
export class ProjectDetailsComponent implements OnInit {

  private readonly dialogRef: DialogRef<Project, boolean> = inject(DialogRef);
  private readonly gallery: Gallery = inject(Gallery);

  public projectDetails: Project = this.dialogRef.data;
  public images: GalleryItem[] = this.projectDetails.gallery.map(urlImg =>
    new ImageItem({ src: urlImg, thumb: urlImg })
  );
  public readonly iconGit = faGithub;
  public readonly iconPlay = faGooglePlay;
  public readonly galleryId: string = "galleryProject"

  public ngOnInit(): void {
    const galleryProject = this.gallery.ref(this.galleryId);
    galleryProject.load(this.images);
  }

  public getImgUrl(src?: string | { url: string; type: string }[]): string {
    return typeof src === 'string' ? src : '';
  }
}