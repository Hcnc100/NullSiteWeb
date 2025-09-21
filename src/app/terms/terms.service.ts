import { Injectable } from '@angular/core';
import type { Firestore} from '@angular/fire/firestore';
import { doc, docData, getDoc } from '@angular/fire/firestore';
import type { Terms } from '../models/Terms';
import type { Observable} from 'rxjs';
import { from, switchMap, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TermsService {
  constructor(private readonly firestore: Firestore) { }

  getTerms(projectID: string): Observable<Terms> {
    const documentData = doc(this.firestore, "terms", projectID);

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