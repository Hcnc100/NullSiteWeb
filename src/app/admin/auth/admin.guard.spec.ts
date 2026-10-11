import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';
import type { AdminAccess } from './admin-auth.service';
import { adminGuard, unsavedChangesGuard } from './admin.guard';

describe('Administrative route guards', () => {
  let access: AdminAccess;
  let auth: { access: () => AdminAccess; whenReady: () => Promise<AdminAccess>; isAdmin: () => boolean };
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  beforeEach(() => {
    access = 'anonymous';
    auth = {
      access: (): AdminAccess => access,
      whenReady: (): Promise<AdminAccess> => Promise.resolve(access),
      isAdmin: (): boolean => access === 'admin',
    };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AdminAuthService, useValue: auth }] });
  });

  it('allows admin access', async () => {
    access = 'admin';
    expect(await TestBed.runInInjectionContext(() => adminGuard(route, state))).toBe(true);
  });

  for (const denied of ['anonymous', 'forbidden', 'error'] as const) {
    it(`redirects ${denied} to the dedicated login`, async () => {
      access = denied;
      const result = await TestBed.runInInjectionContext(() => adminGuard(route, state));
      expect(result instanceof UrlTree).toBe(true);
      expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/admin/login');
    });
  }

  it('protects dirty forms and respects cancelled navigation', () => {
    access = 'admin';
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const editor = { hasUnsavedChanges: (): boolean => true, isSaving: (): boolean => false };
    expect(TestBed.runInInjectionContext(() => unsavedChangesGuard(editor, route, state, state))).toBe(false);
  });

  it('does not trap a revoked or signed-out session in a private editor', () => {
    vi.spyOn(window, 'confirm');
    const editor = { hasUnsavedChanges: (): boolean => true, isSaving: (): boolean => true };
    expect(TestBed.runInInjectionContext(() => unsavedChangesGuard(editor, route, state, state))).toBe(true);
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it('blocks navigation during a save', () => {
    access = 'admin';
    const editor = { hasUnsavedChanges: (): boolean => false, isSaving: (): boolean => true };
    expect(TestBed.runInInjectionContext(() => unsavedChangesGuard(editor, route, state, state))).toBe(false);
  });

  it('still protects dirty data while a token refresh is pending', () => {
    access = 'loading';
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const editor = { hasUnsavedChanges: (): boolean => true, isSaving: (): boolean => false };
    expect(TestBed.runInInjectionContext(() => unsavedChangesGuard(editor, route, state, state))).toBe(false);
  });
});
