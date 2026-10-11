import type { Project } from "../../models/Project";
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { faGithub, faGooglePlay } from "@fortawesome/free-brands-svg-icons";
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ImgDetailsProjectComponent } from "../img-details-project/img-details-project.component";
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { localizedText } from '../../i18n/translations';
import { isHttpsUrl } from '../../models/profile-editor.model';
import { ImageViewerComponent } from '../../share/image-viewer/image-viewer.component';
import { PUBLIC_DIALOG_CONFIG } from '../../share/image-viewer/public-dialog.config';
import { imageAlt, thumbnailUrl } from '../../models/project-media';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FaIconComponent,
    ImgDetailsProjectComponent,
    TranslatePipe,
  ]
})
export class ProjectDetailsComponent {
  public readonly i18n = inject(I18nService);
  public readonly localizedText = localizedText;
  public readonly isHttpsUrl = isHttpsUrl;

  public readonly dialogRef = inject(DialogRef);
  private readonly dialog = inject(Dialog);

  public readonly projectDetails = inject<Project>(DIALOG_DATA);
  public readonly media = computed(() => (this.projectDetails.gallery ?? []).filter(isHttpsUrl).map((url, index) => {
    const item = this.projectDetails.galleryItems?.find(image => image.url === url);
    return { url, thumbnail: thumbnailUrl(item?.thumbnailUrl, url),
      alt: imageAlt(item?.alt, item?.translations, this.i18n.locale(), `${this.projectDetails.name} · ${this.i18n.text('Captura')} ${index + 1}`) };
  }));
  public get images(): { url: string; alt: string; thumbnail: string }[] { return this.media(); }
  public readonly iconGit = faGithub;
  public readonly iconPlay = faGooglePlay;
  public openImage(index: number): void {
    this.dialog.open(ImageViewerComponent, {
      ...PUBLIC_DIALOG_CONFIG,
      ariaLabelledBy: 'image-dialog-title',
      data: { title: this.projectDetails.name, images: this.images, index },
    });
  }
}
