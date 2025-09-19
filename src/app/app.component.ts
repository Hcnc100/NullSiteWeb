import { Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NavbarComponent } from './navigation/navbar/navbar.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    BrowserModule,
    FontAwesomeModule,
    NavbarComponent,
    RouterOutlet
  ],
})
export class AppComponent {
  title = 'Ricardo Pájaro Coatl';

}
