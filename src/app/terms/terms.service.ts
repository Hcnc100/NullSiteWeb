import { inject, Injectable } from '@angular/core';
import type { DocumentReference } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { doc, docData, getDoc } from '@angular/fire/firestore';
import type { Terms } from '../models/Terms';
import type { Observable } from 'rxjs';
import { from, switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TermsService {

  private readonly firestore: Firestore = inject(Firestore);


  public getTerms(projectID: string): Observable<Terms> {
    const documentData: DocumentReference = doc(this.firestore, "terms", projectID);

    return from(getDoc(documentData)).pipe(
      switchMap((doc) => {
        if (doc.exists()) {
          return docData(documentData) as Observable<Terms>;
        } else {
          return throwError(() => "No se encontró el documento ");
        }
      })
    );
  }


}