import { Component, inject, signal } from '@angular/core';
import { ResumeService } from './resume.service';
import { I18nService } from '../i18n/i18n.service';
import { TranslatePipe } from '../i18n/translate.pipe';

@Component({ selector: 'app-resume-download', standalone: true, imports: [TranslatePipe],
  template: `@if (service.resume(); as resume) {
    <button type="button" [disabled]="busy()" (click)="download()">{{(busy() ? 'Descargando…' :
      resume.storagePath.includes('/' + i18n.locale() + '/') ? 'Descargar CV' :
      resume.storagePath.includes('/es/') ? 'Descargar CV (español)' : 'Descargar CV (inglés)') | t}}</button>
    @if (error()) { <p role="alert">{{error() | t}}</p> }
  }`,
  styles: [`:host{display:block;margin-block:20px}button{font:inherit;min-height:44px;padding:10px 20px;
    border:1px solid currentColor;border-radius:5px;background:white;color:black;cursor:pointer}
    button:focus-visible{outline:3px solid #c9bbff;outline-offset:4px}p{margin-top:8px}`],
})
export class ResumeDownloadComponent {
  public readonly service = inject(ResumeService);
  public readonly i18n = inject(I18nService);
  public readonly busy = signal(false);
  public readonly error = signal('');
  public async download(): Promise<void> {
    const entry = this.service.resume();
    if (entry === undefined || this.busy()) return;
    this.busy.set(true); this.error.set('');
    try { await this.service.download(entry); }
    catch { this.error.set('No se pudo descargar el CV. Inténtalo de nuevo.'); }
    finally { this.busy.set(false); }
  }
}
