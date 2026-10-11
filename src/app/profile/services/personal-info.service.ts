import type { Signal } from '@angular/core';
import { computed, inject, Injectable } from '@angular/core';
import type { SocialLink } from "../../models/SocialLink";
import type { InfoProfile } from "../../models/InfoProfile";
import type { DocumentReference } from "@firebase/firestore";
import { Firestore } from "@angular/fire/firestore";
import { doc, docData } from "@angular/fire/firestore";
import { faFacebookF, faGithub, faInstagram, faTwitter, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { toSignal } from "@angular/core/rxjs-interop";
import { defaultSocialLinks, readSocialLinks } from '../../models/profile-editor.model';


@Injectable({
  providedIn: 'root'
})
export class PersonalInfoService {

  private readonly firestore: Firestore = inject(Firestore);

  private readonly infoProfileDocRef: DocumentReference<InfoProfile> = doc(
    this.firestore,
    'infoProfile',
    "nullPointer"
  ) as DocumentReference<InfoProfile>;

  public readonly infoProfile: Signal<InfoProfile | undefined> = toSignal(
    docData(this.infoProfileDocRef)
  );

  public readonly socialLinks = computed<SocialLink[]>(() => {
    const icons = {
      github: faGithub, facebook: faFacebookF, instagram: faInstagram, twitter: faTwitter, whatsapp: faWhatsapp,
    };
    const links = readSocialLinks(this.infoProfile()?.socialLinks) ?? defaultSocialLinks;
    return links.map(link => ({ icon: icons[link.platform], link: link.url, label: link.platform }));
  });

  public get listSocialLink(): SocialLink[] { return this.socialLinks(); }


}
