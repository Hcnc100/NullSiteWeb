import { Component } from '@angular/core';
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
    CommonModule,
    FontAwesomeModule,
    NavbarComponent,
    RouterOutlet
  ],
})
export class AppComponent {
  public readonly title = 'Ricardo Pájaro Coatl';

}
