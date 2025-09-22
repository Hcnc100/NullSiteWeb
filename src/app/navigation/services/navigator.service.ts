import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, filter } from "rxjs";
import type { Observable } from "rxjs";
import { Router } from "@angular/router";
import { NavigationEnd } from "@angular/router";
import { defaultSection } from "../../../utils/Constants";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class NavigatorServices {


  private readonly destroyRef = inject(DestroyRef);
  private readonly _currentSection = new BehaviorSubject<string>(defaultSection);
  public readonly currentSection$: Observable<string> = this._currentSection.asObservable();

  private readonly router = inject(Router);

  public constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        const onlyUrl = event.urlAfterRedirects.replace("/", "");
        this._currentSection.next(onlyUrl);
      });
  }
}
