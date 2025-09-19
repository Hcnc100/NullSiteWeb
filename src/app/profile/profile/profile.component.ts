import { Observable } from "rxjs";
import { Component, OnInit } from '@angular/core';
import { InfoProfile } from "../../models/InfoProfile";
import { PersonalInfoService } from "../services/personal-info.service";
import { ImageProfileComponent } from "../image-profile/image-profile.component";
import { CommonModule } from "@angular/common";
import { PersonalLinksComponent } from "../personal-links/personal-links.component";
import { DescriptionComponent } from "../description/description.component";
import { LoadingComponent } from "src/app/share/loading/loading.component";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [
    ImageProfileComponent,
    CommonModule,
    PersonalLinksComponent,
    DescriptionComponent,
    LoadingComponent
  ]
})
export class ProfileComponent {

  infoProfileAsync: Observable<InfoProfile | undefined>;

  constructor(private personalInfo: PersonalInfoService) {
    this.infoProfileAsync = this.personalInfo.infoProfile
  }

}
