import { vi } from 'vitest';
import type { Mock } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminAuthService } from '../auth/admin-auth.service';
import type { AdminAccess } from '../auth/admin-auth.service';
import { AdminLoginComponent } from './admin-login.component';

describe('AdminLoginComponent', () => {
  const access = signal<AdminAccess>('anonymous');
  let login: Mock;

  beforeEach(() => {
    localStorage.setItem('nullsite.locale', 'es');
    access.set('anonymous');
    login = vi.fn().mockName('login').mockReturnValue(Promise.resolve());
    TestBed.configureTestingModule({
      imports: [AdminLoginComponent],
      providers: [provideRouter([]), { provide: AdminAuthService, useValue: {
        access, isAdmin: (): boolean => access() === 'admin', login,
        logout: vi.fn().mockName('logout').mockReturnValue(Promise.resolve()),
      } }],
    });
  });

  it('does not submit invalid credentials', async () => {
    const component = TestBed.createComponent(AdminLoginComponent).componentInstance;
    await component.submit();
    expect(login).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBe(true);
  });

  it('shows a generic error and clears the password after failed authentication', async () => {
    login.mockReturnValue(Promise.reject(new Error('auth/user-not-found: private details')));
    const component = TestBed.createComponent(AdminLoginComponent).componentInstance;
    component.form.setValue({ email: 'example@example.com', password: 'secret' });
    await component.submit();
    expect(component.error()).toContain('No se pudo iniciar sesión');
    expect(component.error()).not.toContain('user-not-found');
    expect(component.form.controls.password.value).toBe('');
    expect(component.busy()).toBe(false);
  });

  it('explains denied access without rendering a password form or editor', () => {
    access.set('forbidden');
    const fixture = TestBed.createComponent(AdminLoginComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('no tiene permisos administrativos');
    expect(element.querySelector('input[type=password]')).toBeNull();
  });

  it('keeps the login hidden while restoring the session', () => {
    access.set('loading');
    const fixture = TestBed.createComponent(AdminLoginComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Verificando sesión');
    expect((fixture.nativeElement as HTMLElement).querySelector('form')).toBeNull();
  });

  it('redirects an already-authorized account to its panel', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockReturnValue(Promise.resolve(true));
    access.set('admin');
    const fixture = TestBed.createComponent(AdminLoginComponent);
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith('/admin/profile');
  });
});
