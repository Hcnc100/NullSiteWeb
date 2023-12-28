import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, filter, takeUntil } from "rxjs";
import { NavigationEnd, Router, RouterEvent } from "@angular/router";
import { defaultSection, getListSections } from "../../../utils/Constants";

@Injectable({
  providedIn: 'root'
})
export class NavigatorServices {

  private readonly _currentSection = new BehaviorSubject<string>(defaultSection);
  private destroy$ = new Subject<void>();

  /**
   * Constructs a new instance of the NavigatorServices class.
   * @param router An instance of the Angular Router class.
   */
  constructor(
    router: Router
  ) {
    router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        if (event instanceof RouterEvent) {
          const onlyUrl = event.url.substring(1)
          if (onlyUrl == "") {
            this._currentSection.next(defaultSection);
          } else {
            const listUrl = getListSections();
            const newSection = listUrl.includes(onlyUrl) ? onlyUrl : defaultSection;
            this._currentSection.next(newSection);
          }
        }
      });
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Gets an Observable of the current section.
   * @returns An Observable that emits the current section value whenever it changes.
   */
  get currentSection() {
    return this._currentSection.asObservable();
  }
}
