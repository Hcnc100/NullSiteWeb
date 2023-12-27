import { BehaviorSubject, distinctUntilChanged, fromEvent, map, startWith } from "rxjs";
import { Injectable } from '@angular/core';

const MOBILE_SIZE = 600;

@Injectable({
  providedIn: 'root'
})
export class ResizeService {
  private _isMobileSize = new BehaviorSubject<boolean>(window.innerWidth <= MOBILE_SIZE);
  isMobileSize = this._isMobileSize.asObservable();

  private _widthSize = new BehaviorSubject<number>(window.innerWidth);
  widthSize = this._widthSize.asObservable();

  constructor() {
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