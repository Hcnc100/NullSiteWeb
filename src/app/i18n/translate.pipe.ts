import { inject, Pipe } from '@angular/core';
import type { PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  public transform(key: string): string { return this.i18n.text(key); }
}
