import type { Signal } from '@angular/core';
import { Component, inject } from '@angular/core';
import { ResizeService } from "../../services/resize/resize.service";
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-image-contact',
  templateUrl: './image-contact.component.html',
  styleUrls: ['./image-contact.component.scss'],
  standalone: true, imports: [TranslatePipe]
})
export class ImageContactComponent {

  public readonly resizeService: ResizeService = inject(ResizeService);

  public readonly isMobile: Signal<boolean> = this.resizeService.isMobileSize;

}
