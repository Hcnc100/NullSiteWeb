import {Injectable} from '@angular/core';
import {Location} from "@angular/common";
import {BehaviorSubject, filter} from "rxjs";
import {NavigationEnd, Router, RouterEvent} from "@angular/router";
import {defaultSection, getListSections} from "../../../utils/Constants";

@Injectable({
  providedIn: 'root'
})
export class NavigatorServices {

  private readonly _currentSection = new BehaviorSubject<string>(defaultSection);

  constructor(
    private location: Location,
    private router: Router
  ) {
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof RouterEvent) {
          const onlyUrl = event.url.substring(1)
          if (onlyUrl == "") {
            this._currentSection.next(defaultSection);
          } else {
            const listUrl = getListSections();
            const newSection = listUrl.find(section => section == onlyUrl)
            this._currentSection.next(newSection);
          }
        }
      });
  }

  get currentSection() {
    return this._currentSection.asObservable();
  }
}
