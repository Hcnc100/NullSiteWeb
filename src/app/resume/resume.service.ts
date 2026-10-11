import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { getBlob, ref } from 'firebase/storage';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { I18nService } from '../i18n/i18n.service';
import { chooseResume } from '../models/resume';
import type { ResumeEntry, ResumeSettings } from '../models/resume';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(I18nService);
  private readonly settings = toSignal(docData(doc(this.firestore, 'siteSettings', 'public'))
    .pipe(catchError(() => of(undefined))));
  public readonly resume = computed(() => chooseResume(this.settings()?.['resume'] as ResumeSettings | undefined,
    this.i18n.locale()));

  public async download(entry: ResumeEntry): Promise<void> {
    const blob = await getBlob(ref(this.storage, entry.storagePath), 10 * 1024 * 1024);
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    const anchor = this.document.createElement('a');
    anchor.href = url; anchor.download = entry.storagePath.includes('/en/') ? 'CV-en.pdf' : 'CV-es.pdf';
    this.document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
