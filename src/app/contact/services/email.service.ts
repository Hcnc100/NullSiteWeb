import { inject, Injectable } from '@angular/core';
import { Firestore, CollectionReference } from '@angular/fire/firestore';
import { collection, collectionData, addDoc, serverTimestamp } from '@angular/fire/firestore';
import type { Observable } from 'rxjs';
import type { Email } from '../../models/Email';
import { collectionNames } from 'src/utils/Constants';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private readonly firestore: Firestore = inject(Firestore);

  public readonly emailList: Observable<Email[]>;
  private readonly emailsCollection: CollectionReference<Email>;

  public constructor() {
    this.emailsCollection = collection(this.firestore, collectionNames.emailCollection) as CollectionReference<Email>;
    this.emailList = collectionData(this.emailsCollection);
  }

  public async sendNewEmail(email: Email): Promise<void> {
    await addDoc(this.emailsCollection, {
      ...email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}
