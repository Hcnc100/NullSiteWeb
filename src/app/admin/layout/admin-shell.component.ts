import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from '../auth/admin-auth.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { AdminIconComponent } from '../admin-icon.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe, AdminIconComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: '../admin-ui.scss',
})
export class AdminShellComponent {
  public readonly auth = inject(AdminAuthService);
  public readonly error = signal('');
  public readonly opened = signal(false);
  private readonly router = inject(Router);

  public constructor() {
    effect(() => {
      if (this.auth.isAdmin()) this.opened.set(true);
      if (this.auth.access() !== 'loading' && !this.auth.isAdmin()) {
        this.opened.set(false);
        void this.router.navigateByUrl('/admin/login');
      }
    });
  }

  public async logout(): Promise<void> {
    // Navigate through CanDeactivate before signing out, so unsaved edits can be cancelled.
    if (!await this.router.navigateByUrl('/home')) return;
    try { await this.auth.logout(); }
    catch { this.error.set('No se pudo cerrar la sesión. Vuelve al acceso e inténtalo de nuevo.'); }
    await this.router.navigateByUrl('/admin/login');
  }
}
