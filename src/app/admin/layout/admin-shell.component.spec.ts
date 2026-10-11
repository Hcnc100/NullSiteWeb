import { vi } from 'vitest';
import type { Mock, MockInstance } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminAuthService } from '../auth/admin-auth.service';
import type { AdminAccess } from '../auth/admin-auth.service';
import { AdminShellComponent } from './admin-shell.component';

describe('AdminShellComponent', () => {
  const access = signal<AdminAccess>('admin');
  let logout: Mock;
  let navigate: MockInstance<Router['navigateByUrl']>;

  beforeEach(() => {
    access.set('admin');
    logout = vi.fn().mockName('logout').mockImplementation((): Promise<void> => {
      access.set('anonymous');
      return Promise.resolve();
    });
    TestBed.configureTestingModule({ imports: [AdminShellComponent], providers: [
      provideRouter([]),
      { provide: AdminAuthService, useValue: {
        access, isAdmin: (): boolean => access() === 'admin',
        user: (): { email: string } => ({ email: 'admin@example.com' }), logout,
      } },
    ] });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockReturnValue(Promise.resolve(true));
  });

  it('does not sign out if the editor cancels navigation', async () => {
    navigate.mockReturnValue(Promise.resolve(false));
    const component = TestBed.createComponent(AdminShellComponent).componentInstance;
    await component.logout();
    expect(logout).not.toHaveBeenCalled();
    expect(access()).toBe('admin');
  });

  it('leaves the protected form before signing out and then opens login', async () => {
    const component = TestBed.createComponent(AdminShellComponent).componentInstance;
    await component.logout();
    expect(navigate.mock.calls).toEqual([['/home'], ['/admin/login']]);
    expect(logout).toHaveBeenCalled();
    expect(access()).toBe('anonymous');
  });

  it('hides the existing outlet during token refresh without destroying the editor', () => {
    const fixture = TestBed.createComponent(AdminShellComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const outlet = element.querySelector('router-outlet');
    expect(outlet).not.toBeNull();
    access.set('loading');
    fixture.detectChanges();
    expect(element.querySelector('router-outlet')).toBe(outlet);
    expect(element.querySelector<HTMLElement>('.admin-page')?.hidden).toBe(true);
  });

  it('removes the private view and redirects after authorization is revoked', () => {
    const fixture = TestBed.createComponent(AdminShellComponent);
    fixture.detectChanges();
    access.set('forbidden');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('router-outlet')).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/admin/login');
  });
});
