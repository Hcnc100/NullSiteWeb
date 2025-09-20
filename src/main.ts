import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { enableProdMode, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { environment } from './environments/environment';
import { appRoutes } from './app/app.routes';

// Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { provideDatabase } from '@angular/fire/database';
import { provideFirestore } from '@angular/fire/firestore';
import { provideStorage } from '@angular/fire/storage';
import { provideAuth } from '@angular/fire/auth';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Extra libs
import { GalleryModule } from 'ng-gallery';
import { provideToastr } from 'ngx-toastr';
import { DialogModule } from '@ngneat/dialog';
import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    // Router
    provideRouter(appRoutes),

    // Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideAuth(() => getAuth()),
    ScreenTrackingService,
    UserTrackingService,

    // Gallery (no tiene provide*, se usa con importProvidersFrom)
    importProvidersFrom(GalleryModule),

    // Toastr (versión standalone)
    provideToastr({
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),

    // Dialog
    importProvidersFrom(DialogModule.forRoot()),

    // Lottie (standalone)
    provideLottieOptions({
      player: () => player,
    }),
  ],
}).catch((err) => console.error(err));
