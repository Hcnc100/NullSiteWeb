import type { DialogConfig } from '@angular/cdk/dialog';

/** Shared geometry and keyboard/focus behavior for public read-only dialogs. */
export const PUBLIC_DIALOG_CONFIG = {
  width: 'calc(100vw - 32px)',
  maxWidth: '880px',
  maxHeight: 'calc(100dvh - 32px)',
  autoFocus: 'first-heading',
  restoreFocus: true,
  ariaModal: true,
  panelClass: 'public-dialog-panel',
  backdropClass: 'public-dialog-backdrop',
} satisfies DialogConfig;
