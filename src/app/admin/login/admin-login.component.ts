import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuthService } from '../auth/admin-auth.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './admin-login.component.html',
  styleUrl: '../admin-ui.scss',
})
export class AdminLoginComponent {
  public readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  public readonly busy = signal(false);
  public readonly error = signal('');
  public readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  public constructor() {
    effect(() => {
      if (this.auth.isAdmin()) void this.router.navigateByUrl('/admin/profile');
    });
  }

  public async submit(): Promise<void> {
    if (this.busy() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    try {
      await this.auth.login(email, password);
      if (this.auth.access() === 'error') {
        this.error.set('No se pudieron verificar tus permisos. Intenta entrar de nuevo.');
      }
    } catch {
      // Deliberately avoid account enumeration and displaying raw Firebase errors.
      this.error.set('No se pudo iniciar sesión. Verifica tus datos y tu conexión e inténtalo de nuevo.');
    } finally {
      this.form.controls.password.reset('');
      this.busy.set(false);
    }
  }

  public async logout(): Promise<void> {
    this.error.set('');
    try { await this.auth.logout(); }
    catch { this.error.set('No se pudo cerrar la sesión. Inténtalo de nuevo.'); }
  }
}
