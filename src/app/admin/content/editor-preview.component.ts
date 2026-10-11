import { Component, input } from '@angular/core';
import { isHttpsUrl } from '../../models/profile-editor.model';

@Component({
  selector: 'app-editor-preview', standalone: true,
  template: `<article class="preview">
    @if (safeImage()) { <img [src]="safeImage()" [alt]="alt() || title()" referrerpolicy="no-referrer"> }
    <h3>{{title()}}</h3><p>{{description()}}</p>
    @if (details()) { <p class="details">{{details()}}</p> }
  </article>`,
  styles: [`:host{display:block;min-width:0}.preview{border:1px solid var(--admin-border,#51515d);border-radius:12px;padding:20px;background:var(--admin-bg,#101013);overflow-wrap:anywhere}
    img{display:block;width:100%;max-height:320px;object-fit:contain;border-radius:8px;background:#101013}
    h3{font-size:1.3rem;margin:16px 0 8px}p{white-space:pre-wrap;line-height:1.65}.details{color:var(--admin-muted,#c1c1cd)}`],
})
export class EditorPreviewComponent {
  public readonly title = input('');
  public readonly description = input('');
  public readonly image = input('');
  public readonly alt = input('');
  public readonly details = input('');
  public safeImage(): string { return isHttpsUrl(this.image()) ? this.image() : ''; }
}
