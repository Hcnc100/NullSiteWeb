import type { Observable } from "rxjs";
import { inject, Injectable } from '@angular/core';
import type { SocialLink } from "../../models/SocialLink";
import type { InfoProfile } from "../../models/InfoProfile";
import type { DocumentReference } from "@firebase/firestore";
import { Firestore } from "@angular/fire/firestore";
import { doc, docData } from "@angular/fire/firestore";
import { faFacebookF, faGithub, faInstagram, faTwitter, faWhatsapp } from "@fortawesome/free-brands-svg-icons";


@Injectable({
  providedIn: 'root'
})
export class PersonalInfoService {

  public readonly listSocialLink: SocialLink[] = [
    {
      icon: faGithub,
      link: 'https://github.com/Hcnc100',
    },
    {
      icon: faFacebookF,
      link: 'https://www.facebook.com/ricardo.pajarocoatl/',
    },
    {
      icon: faInstagram,
      link: 'https://www.instagram.com/ricardopajarocoatl1/',
    },
    {
      icon: faTwitter,
      link: 'https://twitter.com/Ricardo_hcnc',
    },
    {
      icon: faWhatsapp,
      link: 'https://wa.me/522221707686',
    }
  ];

  public readonly infoProfile: Observable<InfoProfile | undefined>;

  private readonly firestore: Firestore = inject(Firestore);

  public constructor() {
    this.infoProfile = docData<InfoProfile>(
      doc(this.firestore, 'infoProfile', "nullPointer") as DocumentReference<InfoProfile>
    );
  }
}
