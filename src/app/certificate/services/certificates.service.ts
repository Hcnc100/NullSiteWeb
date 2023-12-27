import { Observable } from "rxjs";
import { Injectable } from '@angular/core';
import { Certificate } from "../../models/Certificate";
import { collectionNames } from "../../../utils/Constants";
import { collection, collectionData, CollectionReference, Firestore } from "@angular/fire/firestore";

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
  readonly listCertificates: Observable<Certificate[]>;

  /**
   * Constructs a new CertificatesService.
   * @param firestore The Firestore instance.
   */
  constructor(firestore: Firestore) {
    const certificateCollections = collection(firestore, collectionNames.certificateCollection) as CollectionReference<Certificate>
    this.listCertificates = collectionData(certificateCollections);
  }
}
