import { inject, Injectable } from '@angular/core';
import type { Certificate } from "../../models/Certificate";
import { collectionNames } from "../../../utils/Constants";
import type { CollectionReference } from "@angular/fire/firestore";
import { Firestore } from "@angular/fire/firestore";
import { collection, collectionData } from "@angular/fire/firestore";
import { toSignal } from "@angular/core/rxjs-interop";

/**
 * Service for managing certificates.
 */
@Injectable({
  providedIn: 'root'
})
export class CertificatesService {

  private readonly firestore: Firestore = inject(Firestore);

  private readonly certificateCollections = collection(
    this.firestore,
    collectionNames.certificateCollection
  ) as CollectionReference<Certificate>;


  /**
  * Observable that emits an array of certificates.
  */
  public readonly listCertificates = toSignal(
    collectionData(this.certificateCollections)
  );


}
