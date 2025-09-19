import { Component, OnInit } from '@angular/core';
import { ResizeService } from "./services/resize/resize.service";
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { NavbarComponent } from './navigation/navbar/navbar.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule,
    NavbarComponent,
  ],
})
export class AppComponent {
  title = 'Ricardo Pájaro Coatl';

}
