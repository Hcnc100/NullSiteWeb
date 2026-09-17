import { initializeApp } from '@angular/fire/app';
import { provideFirebaseApp } from '@angular/fire/app';
import { getFirestore } from 'firebase/firestore';
import { provideFirestore } from '@angular/fire/firestore';
import { provideAnalytics } from '@angular/fire/analytics';
import { getAnalytics } from 'firebase/analytics';
import { environment } from '../../environments/environment';
import { provideToastr } from 'ngx-toastr';
import { provideLottieOptions } from 'ngx-lottie';
import { DialogRef } from '@ngneat/dialog';

const testApp = initializeApp(environment.firebase, 'test');

export const firebaseTestProviders = [
  provideFirebaseApp(() => testApp),
  provideFirestore(() => getFirestore(testApp)),
  provideAnalytics(() => getAnalytics(testApp)),
  provideToastr(),
  provideLottieOptions({ player: () => ({}) as never }),
  { provide: DialogRef, useValue: {} },
];



