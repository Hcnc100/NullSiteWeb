import { Component, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Component({
  selector: 'app-language-switcher', standalone: true,
  template: `<nav class="languages" aria-label="Language / Idioma">
    <button type="button" lang="es" aria-label="Español" [attr.aria-pressed]="i18n.locale() === 'es'"
      (click)="i18n.switchLocale('es')">ES</button>
    <button type="button" lang="en" aria-label="English" [attr.aria-pressed]="i18n.locale() === 'en'"
      (click)="i18n.switchLocale('en')">EN</button>
  </nav>`,
  styles: [`.languages{position:fixed;right:12px;top:2px;z-index:900;display:flex;gap:4px}
    button{min-width:44px;min-height:44px;border:1px solid #777;border-radius:6px;background:#16161b;
      color:white;font:600 14px system-ui;cursor:pointer}
    button[aria-pressed=true]{background:#800000;color:white;border-color:#a84b4b}button:focus-visible{outline:3px solid #efb0b0;outline-offset:2px}`],
})
export class LanguageSwitcherComponent { public readonly i18n = inject(I18nService); }
