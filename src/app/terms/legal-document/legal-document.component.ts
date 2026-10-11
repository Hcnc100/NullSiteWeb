import { DOCUMENT } from '@angular/common';
import { afterRenderEffect, Component, computed, ElementRef, inject, input, Renderer2, viewChild,
  ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import type { Terms } from '../../models/Terms';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ResizeService } from '../../services/resize/resize.service';
import { sanitizeLegalHtml } from '../legal-html';

/** The public reader and the future admin preview must use this same rendering boundary. */
@Component({
  selector: 'app-legal-document', standalone: true, imports: [TranslatePipe],
  templateUrl: './legal-document.component.html', styleUrl: './legal-document.component.scss',
  encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegalDocumentComponent {
  public readonly terms = input.required<Terms>();
  public readonly anchorPrefix = input('legal');
  public readonly embedded = input(false);
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly i18n = inject(I18nService);
  private readonly resize = inject(ResizeService);
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  private lastFragmentTarget: HTMLElement | null = null;
  public readonly prefix = computed(() => /^[a-z][a-z0-9-]{0,40}$/.test(this.anchorPrefix()) ? this.anchorPrefix() : 'legal');
  public readonly wide = computed(() => this.resize.widthSize() >= 1200);
  public readonly rendered = computed(() => sanitizeLegalHtml(this.terms().content, this.document, this.prefix()));

  public constructor() {
    afterRenderEffect(() => {
      const content = this.content()?.nativeElement;
      const headings = this.rendered().headings;
      const tableLabel = this.i18n.text('Tabla del documento');
      if (content === undefined) return;
      // Angular strips supplied IDs from innerHTML. Assign only our own IDs to the sanitized headings.
      const elements = Array.from(content.querySelectorAll<HTMLElement>('h2,h3,h4,h5,h6'))
        .filter(element => (element.textContent?.trim().length ?? 0) > 0);
      elements.forEach((element, index) => {
        const heading = headings[index];
        if (heading === undefined) return;
        this.renderer.setAttribute(element, 'id', heading.id);
        this.renderer.setAttribute(element, 'tabindex', '-1');
      });
      for (const table of Array.from(content.querySelectorAll('table'))) {
        const parent = table.parentElement;
        if (parent === null) continue;
        const wrapper: HTMLElement = parent.classList.contains('legal-table-scroll')
          ? parent : this.renderer.createElement('div') as HTMLElement;
        if (wrapper !== parent) {
          this.renderer.setAttribute(wrapper, 'class', 'legal-table-scroll');
          this.renderer.insertBefore(parent, wrapper, table);
          this.renderer.appendChild(wrapper, table);
        }
        this.renderer.setAttribute(wrapper, 'role', 'region');
        this.renderer.setAttribute(wrapper, 'tabindex', '0');
        const caption = table.caption?.textContent?.trim() ?? '';
        this.renderer.setAttribute(wrapper, 'aria-label', caption.length > 0 ? caption.slice(0, 300) : tableLabel);
      }
      const hash = this.document.location?.hash.slice(1);
      const target = elements.find(element => element.id === hash);
      if (target !== undefined && target !== this.lastFragmentTarget) {
        target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start' });
        this.lastFragmentTarget = target;
      }
    });
  }

  public anchorHref(id: string): string {
    const location = this.document.location;
    return `${location?.pathname ?? ''}${location?.search ?? ''}#${id}`;
  }
}
