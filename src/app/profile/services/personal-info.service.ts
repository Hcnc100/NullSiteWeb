import {Observable} from "rxjs";
import {Injectable} from '@angular/core';
import {SocialLink} from "../../models/SocialLink";
import {InfoProfile} from "../../models/InfoProfile";
import {DocumentReference} from "@firebase/firestore";
import {doc, docData, Firestore} from "@angular/fire/firestore";
import {faFacebookF, faGithub, faInstagram, faTwitter, faWhatsapp} from "@fortawesome/free-brands-svg-icons";


@Injectable({
  providedIn: 'root'
})
export class PersonalInfoService {

  listSocialLink: SocialLink[] = [
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

  readonly infoProfile: Observable<InfoProfile>;

  constructor(private firestore: Firestore) {
    this.infoProfile = docData<InfoProfile>(
      doc(this.firestore, 'infoProfile', "nullPointer") as DocumentReference<InfoProfile>
    );
  }
}
