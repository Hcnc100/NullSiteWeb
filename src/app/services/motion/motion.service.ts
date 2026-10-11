import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MotionService {
  private readonly preference = signal(false);
  public readonly reduced = this.preference.asReadonly();
  public constructor() {
    const query = inject(DOCUMENT).defaultView?.matchMedia('(prefers-reduced-motion: reduce)');
    if (query === undefined) return;
    this.preference.set(query.matches);
    const changed = (event: MediaQueryListEvent): void => this.preference.set(event.matches);
    query.addEventListener('change', changed);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', changed));
  }
}
