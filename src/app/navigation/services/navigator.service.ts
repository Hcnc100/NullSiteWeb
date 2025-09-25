import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { filter } from "rxjs";
import { Router } from "@angular/router";
import { NavigationEnd } from "@angular/router";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { defaultSection } from "../../../utils/Constants";


@Injectable({ providedIn: 'root' })
export class NavigatorServices {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  // 👇 ahora un signal en lugar de BehaviorSubject
  private readonly _currentSection = signal<string>(defaultSection);
  public readonly currentSection = this._currentSection.asReadonly();

  public constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        const onlyUrl = event.urlAfterRedirects.replace('/', '');
        this._currentSection.set(onlyUrl || defaultSection);
      });
  }
}