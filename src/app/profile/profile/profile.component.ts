import { Observable } from "rxjs";
import { Component, OnInit } from '@angular/core';
import { InfoProfile } from "../../models/InfoProfile";
import { PersonalInfoService } from "../services/personal-info.service";

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    standalone: false
})
export class ProfileComponent {

  infoProfileAsync: Observable<InfoProfile>

  constructor(private personalInfo: PersonalInfoService) {
    this.infoProfileAsync = this.personalInfo.infoProfile
  }

}
