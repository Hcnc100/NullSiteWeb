import type { Signal } from '@angular/core';
import { Component, inject } from '@angular/core';
import type { InfoProfile } from "../../models/InfoProfile";
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

  private readonly personalInfo: PersonalInfoService = inject(PersonalInfoService);

  public readonly infoProfile: Signal<InfoProfile | undefined> = this.personalInfo.infoProfile;

}
