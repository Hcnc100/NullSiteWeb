import { inject, Injectable } from '@angular/core';
import type { DocumentReference } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { doc, onSnapshot } from '@angular/fire/firestore';
import type { Terms } from '../models/Terms';
import { Observable, filter, timeout } from 'rxjs';
import { readLegalSnapshot } from './legal-snapshot';

@Injectable({
  providedIn: 'root'
})
export class TermsService {

  private readonly firestore: Firestore = inject(Firestore);


  public getTerms(projectID: string): Observable<Terms | null> {
    const documentData: DocumentReference = doc(this.firestore, "terms", projectID);

    return new Observable<Terms | null | undefined>(subscriber =>
      onSnapshot(documentData, { includeMetadataChanges: true }, snapshot => {
        try {
          subscriber.next(readLegalSnapshot({ exists: snapshot.exists(),
            fromCache: snapshot.metadata.fromCache, data: snapshot.data() }));
        } catch (error) {
          subscriber.error(error);
        }
      }, error => subscriber.error(error)),
    ).pipe(
      filter((value): value is Terms | null => value !== undefined),
      // Missing cache entries can wait forever offline. Fail visibly and allow retry instead.
      timeout({ first: 15_000 }),
    );
  }


}
