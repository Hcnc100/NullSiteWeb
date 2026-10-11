import { Component, computed, input, signal } from '@angular/core';
import { thumbnailUrl } from '../../models/project-media';

@Component({
  selector: 'app-img-details-project',
  templateUrl: './img-details-project.component.html',
  styleUrls: ['./img-details-project.component.scss'],
  standalone: true
})
export class ImgDetailsProjectComponent {

  public readonly urlImgProject = input.required<string>();
  public readonly indexScreenshots = input.required<number>();
  public readonly originalUrl = input('');
  private readonly failedUrl = signal('');
  public readonly source = computed(() => this.failedUrl() === this.urlImgProject()
    ? thumbnailUrl(undefined, this.originalUrl()) : thumbnailUrl(undefined, this.urlImgProject()));
  public imageError(): void { this.failedUrl.set(this.urlImgProject()); }



}
