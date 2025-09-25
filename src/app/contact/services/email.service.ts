import type { Signal } from '@angular/core';
import { inject, Injectable } from '@angular/core';
import type { CollectionReference } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { collection, collectionData, addDoc, serverTimestamp } from '@angular/fire/firestore';
import type { Email } from '../../models/Email';
import { collectionNames } from 'src/utils/Constants';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private readonly firestore: Firestore = inject(Firestore);

  private readonly emailsCollection: CollectionReference<Email> = collection(
    this.firestore,
    collectionNames.emailCollection
  ) as CollectionReference<Email>;

  public readonly emailList: Signal<Email[] | undefined> = toSignal(
    collectionData(this.emailsCollection)
  );


  public async sendNewEmail(email: Email): Promise<void> {
    await addDoc(this.emailsCollection, {
      ...email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}
