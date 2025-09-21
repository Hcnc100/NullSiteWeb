import { Injectable } from '@angular/core';
import type { Firestore, CollectionReference} from '@angular/fire/firestore';
import { collection, collectionData, addDoc, serverTimestamp } from '@angular/fire/firestore';
import type { Observable} from 'rxjs';
import { of } from 'rxjs';
import type { Email } from '../../models/Email';
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
