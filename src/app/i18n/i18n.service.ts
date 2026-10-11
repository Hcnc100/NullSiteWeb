import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { messages } from './translations';
import type { Locale } from './translations';

export function localeFromPath(path: string): Locale | undefined {
  return /^\/(es|en)(?:\/|\?|#|$)/.exec(path)?.[1] as Locale | undefined;
}

export function preferredLocale(path: string, saved: string | null, browserLanguage: string): Locale {
  return localeFromPath(path) ?? (saved === 'es' || saved === 'en' ? saved
    : browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'es');
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly current = signal<Locale>('es');
  public readonly locale = this.current.asReadonly();

  public constructor() {
    const window = this.document.defaultView;
    let saved: string | null = null;
    try { saved = window?.localStorage.getItem('nullsite.locale') ?? null; } catch { /* Storage can be blocked. */ }
    this.setLocale(preferredLocale(window?.location.pathname ?? '', saved, window?.navigator.language ?? 'es'));
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()).subscribe(event => {
      const locale = localeFromPath(event.urlAfterRedirects);
      if (locale !== undefined) this.setLocale(locale);
    });
  }

  public text(key: string): string { return messages[key]?.[this.locale() === 'es' ? 0 : 1] ?? key; }

  public publicUrl(section: string): string { return `/${this.locale()}/${section.replace(/^\//, '')}`; }

  public setLocale(locale: Locale): void {
    this.current.set(locale);
    this.document.documentElement.lang = locale;
    try { this.document.defaultView?.localStorage.setItem('nullsite.locale', locale); } catch { /* Optional preference. */ }
  }

  public async switchLocale(locale: Locale): Promise<void> {
    if (this.router.url.startsWith('/admin')) { this.setLocale(locale); return; }
    const currentUrl = this.router.url.replace(/^\/(es|en)(?=\/|\?|#|$)/, '');
    const section = currentUrl === '/' ? '/home' : currentUrl;
    if (await this.router.navigateByUrl(`/${locale}${section}`)) this.setLocale(locale);
  }
}
