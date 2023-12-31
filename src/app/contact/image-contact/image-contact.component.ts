import { Observable } from "rxjs";
import { Component, OnInit } from '@angular/core';
import { ResizeService } from "../../services/resize/resize.service";

@Component({
  selector: 'app-image-contact',
  templateUrl: './image-contact.component.html',
  styleUrls: ['./image-contact.component.scss']
})
export class ImageContactComponent {

  readonly isMobile: Observable<boolean>;

  constructor(resizeService: ResizeService) {
    this.isMobile = resizeService.isMobileSize
  }

}
