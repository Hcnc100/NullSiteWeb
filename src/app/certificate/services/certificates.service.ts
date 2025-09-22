import type { Observable } from "rxjs";
import { inject, Injectable } from '@angular/core';
import type { Certificate } from "../../models/Certificate";
import { collectionNames } from "../../../utils/Constants";
import type { CollectionReference } from "@angular/fire/firestore";
import { Firestore } from "@angular/fire/firestore";
import { collection, collectionData } from "@angular/fire/firestore";

/**
 * Service for managing certificates.
 */
@Injectable({
  providedIn: 'root'
})
export class CertificatesService {

  /**
   * Observable that emits an array of certificates.
   */
  public readonly listCertificates: Observable<Certificate[]>;

  private readonly firestore: Firestore = inject(Firestore);

  /**
   * Constructs a new CertificatesService.
   * @param firestore The Firestore instance.
   */
  public constructor(firestore: Firestore) {
    const certificateCollections = collection(
      firestore,
      collectionNames.certificateCollection
    ) as CollectionReference<Certificate>;
    this.listCertificates = collectionData(certificateCollections);
  }
}
