import type { Signal } from '@angular/core';
import { inject, Injectable } from '@angular/core';
import type { SocialLink } from "../../models/SocialLink";
import type { InfoProfile } from "../../models/InfoProfile";
import type { DocumentReference } from "@firebase/firestore";
import { Firestore } from "@angular/fire/firestore";
import { doc, docData } from "@angular/fire/firestore";
import { faFacebookF, faGithub, faInstagram, faTwitter, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { toSignal } from "@angular/core/rxjs-interop";


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

  private readonly firestore: Firestore = inject(Firestore);

  private readonly infoProfileDocRef: DocumentReference<InfoProfile> = doc(
    this.firestore,
    'infoProfile',
    "nullPointer"
  ) as DocumentReference<InfoProfile>;

  public readonly infoProfile: Signal<InfoProfile | undefined> = toSignal(
    docData(this.infoProfileDocRef)
  );


}
