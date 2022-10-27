import {Component, OnInit} from '@angular/core';
import {SocialLink} from "../../models/SocialLink";
import {PersonalInfoService} from "../services/personal-info.service";

@Component({
  selector: 'app-personal-links',
  templateUrl: './personal-links.component.html',
  styleUrls: ['./personal-links.component.scss']
})
export class PersonalLinksComponent implements OnInit {

  listSocialLink: SocialLink[]

  constructor(personalInfo: PersonalInfoService) {
    this.listSocialLink = personalInfo.listSocialLink;
  }

  ngOnInit(): void {
  }

}
