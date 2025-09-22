import { BehaviorSubject, distinctUntilChanged, fromEvent, map, startWith } from "rxjs";
import { Injectable } from '@angular/core';

const MOBILE_SIZE = 600;

@Injectable({
  providedIn: 'root'
})
export class ResizeService {
  private readonly _isMobileSize = new BehaviorSubject<boolean>(window.innerWidth <= MOBILE_SIZE);
  public isMobileSize = this._isMobileSize.asObservable();

  private readonly _widthSize = new BehaviorSubject<number>(window.innerWidth);
  public widthSize = this._widthSize.asObservable();

  public constructor() {
    fromEvent(window, 'resize').pipe(
      map(() => window.innerWidth),
      distinctUntilChanged(),
      startWith(window.innerWidth)
    ).subscribe(newSize => {
      this._isMobileSize.next(newSize <= MOBILE_SIZE);
      this._widthSize.next(newSize);
    });
  }

}