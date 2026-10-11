import { afterRenderEffect, Directive, ElementRef, inject, input } from '@angular/core';
import { LabImagesService, labImagePath } from './lab-images.service';
import { sanitizeLegalHtml } from '../../terms/legal-html';

@Directive({ selector: '[appLabImages]', standalone: true })
export class LabImagesDirective {
  readonly html = input.required<string>({ alias: 'appLabImages' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly images = inject(LabImagesService);
  constructor() {
    afterRenderEffect(() => {
      // Angular removes data-* in innerHTML. Resolve paths from a fresh sanitized inert copy,
      // never by restoring arbitrary attributes or trusting the raw stored HTML.
      const template = document.createElement('template');
      template.innerHTML = sanitizeLegalHtml(this.html(), document, 'legal', labImagePath).html;
      const sources = Array.from(template.content.querySelectorAll('img'));
      for (const [index, image] of Array.from(this.host.nativeElement.querySelectorAll<HTMLImageElement>('img')).entries()) {
        const path = sources[index]?.getAttribute('data-image-path') ?? '';
        void this.images.image(path).then(url => { if (this.host.nativeElement.contains(image)) image.src = url; }).catch(() => { image.title = 'Imagen privada no disponible. Inicia sesión.'; });
      }
    });
  }
}
