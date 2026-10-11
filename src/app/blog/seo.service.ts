import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { I18nService } from '../i18n/i18n.service';

interface PageSeo { path: string; title: string; description: string; index: boolean; article?: boolean; }

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly path = toSignal(this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => event.urlAfterRedirects.split(/[?#]/)[0]), startWith(this.router.url.split(/[?#]/)[0])), { initialValue: '/' });
  private readonly page = signal<PageSeo | null>(null);
  public constructor() {
    effect(() => {
      const path = this.path(); const locale = this.i18n.locale(); const page = this.page();
      const matched = page?.path === path ? page : null;
      const section = path.split('/')[2] ?? 'home';
      const publicPage = /^\/(es|en)\/(home|skills|project|certificate|contact)$/.test(path);
      const title = matched?.title ?? this.i18n.text(section);
      const description = matched?.description ?? (locale === 'es'
        ? 'Portafolio de Ricardo Pajaro Coatl: desarrollo móvil, proyectos y habilidades.'
        : 'Ricardo Pajaro Coatl portfolio: mobile development, projects and skills.');
      const index = matched?.index ?? publicPage;
      this.title.setTitle(`${title} · Ricardo Pajaro Coatl`);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ name: 'robots', content: index ? 'index,follow' : 'noindex,nofollow' });
      const origin = this.document.defaultView?.location.origin ?? '';
      const url = origin + path;
      for (const [property, content] of Object.entries({ 'og:title': `${title} · Ricardo Pajaro Coatl`,
        'og:description': description, 'og:url': url, 'og:type': matched?.article === true ? 'article' : 'website',
        'og:locale': locale === 'es' ? 'es_MX' : 'en_US' })) this.meta.updateTag({ property, content });
      this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
      this.document.head.querySelectorAll('link[data-site-seo],script[data-site-seo]').forEach(node => node.remove());
      if (index) {
        this.link('canonical', url);
        if (publicPage || /^\/(es|en)\/blog$/.test(path)) {
          for (const language of ['es', 'en']) this.link('alternate', origin + path.replace(/^\/(es|en)/, `/${language}`), language);
        }
        if (matched?.article === true) {
          const script = this.document.createElement('script'); script.type = 'application/ld+json';
          script.dataset['siteSeo'] = 'true';
          script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting',
            headline: title, description, inLanguage: locale, mainEntityOfPage: url,
            author: { '@type': 'Person', name: 'Ricardo Pajaro Coatl' } }).replace(/</g, '\\u003c');
          this.document.head.appendChild(script);
        }
      }
    });
  }
  public setPage(page: PageSeo): void { this.page.set(page); }
  private link(rel: string, href: string, language?: string): void {
    const link = this.document.createElement('link'); link.rel = rel; link.href = href;
    link.dataset['siteSeo'] = 'true'; if (language !== undefined) link.hreflang = language; this.document.head.appendChild(link);
  }
}
