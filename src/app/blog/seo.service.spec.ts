import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { SeoService } from './seo.service';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class Page {}

describe('Route SEO', () => {
  beforeEach(() => {
    localStorage.setItem('nullsite.locale', 'es');
    TestBed.configureTestingModule({ providers: [provideRouter([
      { path: 'es/home', component: Page }, { path: 'es/blog/post', component: Page },
      { path: 'admin/login', component: Page },
    ])] });
  });
  it('provides canonical/hreflang for public pages and noindex for admin', async () => {
    TestBed.inject(SeoService); const router = TestBed.inject(Router); const doc = TestBed.inject(DOCUMENT);
    await router.navigateByUrl('/es/home?tracking=x'); TestBed.flushEffects();
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toContain('/es/home');
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).not.toContain('tracking');
    expect(doc.head.querySelectorAll('link[data-site-seo][hreflang]').length).toBe(2);
    await router.navigateByUrl('/admin/login'); TestBed.flushEffects();
    expect(doc.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,nofollow');
    expect(doc.head.querySelector('link[data-site-seo]')).toBeNull();
  });
  it('removes article structured data after withdrawal and does not invent an English translation', async () => {
    const seo = TestBed.inject(SeoService); const doc = TestBed.inject(DOCUMENT);
    await TestBed.inject(Router).navigateByUrl('/es/blog/post');
    seo.setPage({ path: '/es/blog/post', title: 'Article', description: 'Description', index: true, article: true });
    TestBed.flushEffects();
    expect(doc.head.querySelector('script[data-site-seo]')?.textContent).toContain('BlogPosting');
    expect(doc.head.querySelector('link[hreflang="en"]')).toBeNull();
    seo.setPage({ path: '/es/blog/post', title: 'Blog', description: '', index: false }); TestBed.flushEffects();
    expect(doc.head.querySelector('script[data-site-seo]')).toBeNull();
    expect(doc.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,nofollow');
  });
});
