import type { Project } from "../../models/Project";
import { Component, computed, inject, input, signal } from '@angular/core';
import { I18nService } from '../../i18n/i18n.service';
import { localizedText } from '../../i18n/translations';
import { thumbnailUrl } from '../../models/project-media';

@Component({
  selector: 'app-card-project',
  templateUrl: './card-project.component.html',
  styleUrls: ['./card-project.component.scss'],
  standalone: true
})
export class CardProjectComponent {
  public readonly i18n = inject(I18nService);
  public readonly localizedText = localizedText;
  public readonly thumbnailUrl = thumbnailUrl;

  public readonly project = input.required<Project>();
  private readonly failedUrl = signal('');
  public readonly imageSource = computed(() => {
    const project = this.project(); const source = thumbnailUrl(project.thumbnailUrl, project.urlImg);
    return source === this.failedUrl() ? thumbnailUrl(undefined, project.urlImg) : source;
  });
  public imageError(): void { this.failedUrl.set(thumbnailUrl(this.project().thumbnailUrl, this.project().urlImg)); }

}
