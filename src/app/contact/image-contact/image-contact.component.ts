import type { Observable } from "rxjs";
import { Component, inject } from '@angular/core';
import { ResizeService } from "../../services/resize/resize.service";

@Component({
  selector: 'app-image-contact',
  templateUrl: './image-contact.component.html',
  styleUrls: ['./image-contact.component.scss'],
  standalone: true
})
export class ImageContactComponent {

  public readonly resizeService: ResizeService = inject(ResizeService);

  public readonly isMobile: Observable<boolean>;

  public constructor() {
    this.isMobile = this.resizeService.isMobileSize;
  }

}
