import {Observable} from "rxjs";
import {Email} from "../../models/Email";
import {Injectable} from '@angular/core';
import {collectionNames} from "../../../utils/Constants";
import {
  addDoc,
  collection,
  collectionData,
  CollectionReference,
  Firestore,
  serverTimestamp
} from "@angular/fire/firestore";

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  readonly listProjects: Observable<Email[]>;
  private readonly emailsCollection: CollectionReference;

  constructor(private firestore: Firestore) {
    this.emailsCollection = collection(firestore, collectionNames.emailCollection);
    this.listProjects = collectionData(this.emailsCollection as CollectionReference<Email>);
  }

  async sendNewEmail(email: Email) {
    await addDoc(this.emailsCollection, {
      ...email,
      timestamp: serverTimestamp()
    })
  }
}
