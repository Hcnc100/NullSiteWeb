import { inject } from '@angular/core';
import type { CanActivateFn, CanDeactivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  return (await auth.whenReady()) === 'admin' ? true : router.createUrlTree(['/admin/login']);
};

export interface UnsavedEditor {
  hasUnsavedChanges: () => boolean;
  isSaving: () => boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<UnsavedEditor> = component => {
  const auth = inject(AdminAuthService);
  if (auth.access() !== 'loading' && !auth.isAdmin()) return true;
  if (component.isSaving()) return false;
  return !component.hasUnsavedChanges() || window.confirm('Tienes cambios sin guardar. ¿Quieres salir y descartarlos?');
};
