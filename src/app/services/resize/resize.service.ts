import {BehaviorSubject} from "rxjs";
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResizeService {
  private _isMobileSize = new BehaviorSubject<boolean>(true);
  isMobileSize = this._isMobileSize.asObservable();

  constructor() {
  }

  private _widthSize = new BehaviorSubject<number>(600);

  get widthSize() {
    return this._widthSize.asObservable();
  }


  onResize(newSize: number) {
    this._isMobileSize.next(newSize <= 600);
    this._widthSize.next(newSize);
  }
}
