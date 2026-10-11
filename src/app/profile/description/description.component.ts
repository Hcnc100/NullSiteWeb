import { Component, inject, input } from '@angular/core';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { localizedText } from '../../i18n/translations';
import type { InfoProfile } from "../../models/InfoProfile";
import { ResumeDownloadComponent } from '../../resume/resume-download.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss'],
  standalone: true,
  imports: [TranslatePipe, ResumeDownloadComponent, RouterLink],
})
export class DescriptionComponent {
  public readonly i18n = inject(I18nService);
  public readonly localizedText = localizedText;

  public readonly infoProfile = input.required<InfoProfile>();


}
