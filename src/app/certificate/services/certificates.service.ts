import {Observable} from "rxjs";
import {Injectable} from '@angular/core';
import {Certificate} from "../../models/Certificate";
import {collectionNames} from "../../../utils/Constants";
import {collection, collectionData, CollectionReference, Firestore} from "@angular/fire/firestore";

@Injectable({
  providedIn: 'root'
})
export class CertificatesService {


  readonly listCertificates: Observable<Certificate[]>;
  private readonly certificateCollections: CollectionReference<Certificate>;

  constructor(private firestore: Firestore) {
    this.certificateCollections = collection(firestore, collectionNames.certificateCollection) as CollectionReference<Certificate>
    this.listCertificates = collectionData(this.certificateCollections);
  }
}
