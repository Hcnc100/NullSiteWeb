import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NavigationModule} from "./navigation/navigation.module";

import {ProfileModule} from "./profile/profile.module";
import {SkillsModule} from "./skills/skills.module";
import {ContactModule} from "./contact/contact.module";
import {ProjectsModule} from "./projects/projects.module";

import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService} from '@angular/fire/analytics';
import {getDatabase, provideDatabase} from '@angular/fire/database';
import {getFirestore, provideFirestore} from '@angular/fire/firestore';
import {getStorage, provideStorage} from '@angular/fire/storage';
import {getAuth, provideAuth} from '@angular/fire/auth';
import {environment} from "../environments/environment";
import {CertificateModule} from "./certificate/certificate.module";
import {ShareModule} from "./share/share.module";
import {RouteReuseStrategy} from "@angular/router";
import {CustomReuseStrategy} from "./cache-route-reuse.strategy";


@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule,
    NavigationModule,
    ProfileModule,
    SkillsModule,
    ContactModule,
    ProjectsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAnalytics(() => getAnalytics()),
    provideDatabase(() => getDatabase()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideAuth(() => getAuth()),
    CertificateModule,
    ShareModule,
  ],
  providers: [
    ScreenTrackingService,
    UserTrackingService,
    {
      provide: RouteReuseStrategy,
      useClass: CustomReuseStrategy
    }
  ],
  exports: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
