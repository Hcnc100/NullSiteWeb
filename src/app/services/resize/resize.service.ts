import { Injectable, signal, effect, DestroyRef, inject } from '@angular/core';

const MOBILE_SIZE = 600;

@Injectable({ providedIn: 'root' })
export class ResizeService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly _widthSize = signal<number>(window.innerWidth);
  private readonly _isMobileSize = signal<boolean>(window.innerWidth <= MOBILE_SIZE);

  public readonly widthSize = this._widthSize.asReadonly();
  public readonly isMobileSize = this._isMobileSize.asReadonly();

  public constructor() {
    const resizeHandler = (): void => {
      const newWidth = window.innerWidth;
      this._widthSize.set(newWidth);
      this._isMobileSize.set(newWidth <= MOBILE_SIZE);
    };

    window.addEventListener('resize', resizeHandler);

    // Clean up automatically cuando el injector se destruya
    effect(
      () => this.destroyRef.onDestroy(() => window.removeEventListener('resize', resizeHandler))
    );
  }
}
