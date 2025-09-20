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
  private readonly emailsCollection: CollectionReference;

  constructor(public firestore: Firestore) {
    console.log('Firestore instance:', this.firestore); // Debug line to check Firestore instance
    this.emailsCollection = collection(firestore, collectionNames.emailCollection) as CollectionReference<Email>;
    this.emailList = of([]);
  }

  async sendNewEmail(email: Email) {
    //   await addDoc(this.emailsCollection, {
    //     ...email,
    //     createdAt: serverTimestamp(),
    //     updatedAt: serverTimestamp()
    //   })
    // }
  }
}
