import { Injectable } from '@angular/core';
import { Firestore, collection, CollectionReference, collectionData, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { Email } from '../../models/Email';
import { collectionNames } from 'src/utils/Constants';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  readonly emailList: Observable<Email[]>;
  private readonly emailsCollection: CollectionReference<Email>;

  constructor(firestore: Firestore) {
    this.emailsCollection = collection(firestore, collectionNames.emailCollection) as CollectionReference<Email>;
    this.emailList = collectionData(this.emailsCollection);
  }

  async sendNewEmail(email: Email) {
    await addDoc(this.emailsCollection, {
      ...email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
}
