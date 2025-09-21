import type { Observable} from "rxjs";
import { of } from "rxjs";
import { Injectable } from '@angular/core';
import type { SocialLink } from "../../models/SocialLink";
import type { InfoProfile } from "../../models/InfoProfile";
import type { DocumentReference } from "@firebase/firestore";
import type { Firestore } from "@angular/fire/firestore";
import { doc, docData } from "@angular/fire/firestore";
import { faFacebookF, faGithub, faInstagram, faTwitter, faWhatsapp } from "@fortawesome/free-brands-svg-icons";


@Injectable({
  providedIn: 'root'
})
export class PersonalInfoService {

  readonly listSocialLink: SocialLink[] = [
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

  readonly infoProfile: Observable<InfoProfile | undefined>;

  constructor(firestore: Firestore) {
    this.infoProfile = docData<InfoProfile>(
      doc(firestore, 'infoProfile', "nullPointer") as DocumentReference<InfoProfile>
    );
  }
}
