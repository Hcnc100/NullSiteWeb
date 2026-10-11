import { afterRenderEffect, Directive, ElementRef, inject, input, Renderer2 } from '@angular/core';
import { colorFromClass, backgroundFromClass } from './rich-text-format';

/** Apply only a strictly validated hex color after Angular's normal HTML sanitization. */
@Directive({ selector: '[appRichColors]', standalone: true })
export class RichColorsDirective {
  public readonly html = input.required<string>({ alias: 'appRichColors' });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  public constructor() {
    afterRenderEffect(() => {
      this.html();
      for (const element of Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[class]'))) {
        const color = Array.from(element.classList).map(colorFromClass).find(value => value !== null);
        if (color) this.renderer.setStyle(element, 'color', color);
        const background = Array.from(element.classList).map(backgroundFromClass).find(value => value !== null);
        if (background) this.renderer.setStyle(element, 'background-color', background);
      }
    });
  }
}
