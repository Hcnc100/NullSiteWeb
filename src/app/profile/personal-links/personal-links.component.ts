import { Component, OnInit } from '@angular/core';
import type { SocialLink } from "../../models/SocialLink";
import type { PersonalInfoService } from "../services/personal-info.service";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-personal-links',
  templateUrl: './personal-links.component.html',
  styleUrls: ['./personal-links.component.scss'],
  standalone: true,
  imports: [FaIconComponent]
})
export class PersonalLinksComponent {

  readonly listSocialLink: SocialLink[];

  constructor(personalInfo: PersonalInfoService) {
    this.listSocialLink = personalInfo.listSocialLink;
  }


}
