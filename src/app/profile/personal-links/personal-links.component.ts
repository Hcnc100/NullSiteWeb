import { Component, inject } from '@angular/core';
import type { SocialLink } from "../../models/SocialLink";
import { PersonalInfoService } from "../services/personal-info.service";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-personal-links',
  templateUrl: './personal-links.component.html',
  styleUrls: ['./personal-links.component.scss'],
  standalone: true,
  imports: [FaIconComponent]
})
export class PersonalLinksComponent {

  private readonly personalInfo: PersonalInfoService = inject(PersonalInfoService);

  public readonly listSocialLink: SocialLink[] = this.personalInfo.listSocialLink;

}
