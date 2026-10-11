import { Component, inject } from '@angular/core';
import { NavbarComponent } from './navigation/navbar/navbar.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LanguageSwitcherComponent } from './i18n/language-switcher.component';
import { TranslatePipe } from './i18n/translate.pipe';
import { SeoService } from './blog/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LanguageSwitcherComponent,
    TranslatePipe,
    FontAwesomeModule,
    NavbarComponent,
    RouterOutlet,
    RouterLink
  ],
})
export class AppComponent {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  public readonly isAdminRoute = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => event.urlAfterRedirects),
    startWith(this.router.url),
    map(url => /^\/admin(?:\/|\?|#|$)/.test(url)),
  ), { initialValue: false });
  public readonly title = 'Ricardo Pájaro Coatl';

}
