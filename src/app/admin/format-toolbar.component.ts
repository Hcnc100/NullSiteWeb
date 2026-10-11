import { Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeading, faParagraph, faBold, faItalic, faListUl, faListOl, faQuoteLeft, faCode } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '../i18n/translate.pipe';

export type EditorFormat = 'h2' | 'h3' | 'p' | 'strong' | 'em' | 'ul' | 'ol' | 'blockquote' | 'pre';
@Component({
  selector: 'app-format-toolbar', standalone: true, imports: [FontAwesomeModule, TranslatePipe],
  template: `<div class="toolbar" role="group" [attr.aria-label]="'Formato del texto' | t">
    @for (option of options; track option.tag) {
      @if (option.tag !== 'pre' || code()) {
        <button type="button" [disabled]="disabled()" (mousedown)="$event.preventDefault()" (click)="format.emit(option.tag)" [title]="option.label | t">
          <fa-icon [icon]="option.icon" aria-hidden="true" /><span>{{option.label | t}}</span>
        </button>
      }
    }
  </div>`,
  styles: [`.toolbar{display:flex;flex-wrap:wrap;gap:6px;padding:10px;border:1px solid var(--admin-border);border-radius:8px;background:var(--admin-bg)}
    button{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 12px;font:inherit;color:var(--admin-text);background:transparent;border:1px solid transparent;border-radius:6px;cursor:pointer}
    button:hover{background:rgba(255,0,0,.2)}button:focus-visible{outline:3px solid var(--admin-accent);outline-offset:2px}button:disabled{opacity:.6;cursor:not-allowed}`],
})
export class FormatToolbarComponent {
  public readonly disabled = input(false);
  public readonly code = input(false);
  public readonly format = output<EditorFormat>();
  public readonly options = [
    { tag: 'h2', label: 'Título de sección', icon: faHeading },
    { tag: 'h3', label: 'Subtítulo', icon: faHeading },
    { tag: 'p', label: 'Párrafo', icon: faParagraph },
    { tag: 'strong', label: 'Negrita', icon: faBold },
    { tag: 'em', label: 'Cursiva', icon: faItalic },
    { tag: 'ul', label: 'Lista con viñetas', icon: faListUl },
    { tag: 'ol', label: 'Lista numerada', icon: faListOl },
    { tag: 'blockquote', label: 'Cita', icon: faQuoteLeft },
    { tag: 'pre', label: 'Bloque de código', icon: faCode },
  ] as const;
}
