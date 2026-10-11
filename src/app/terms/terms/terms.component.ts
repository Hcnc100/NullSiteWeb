import { TermsService } from './../terms.service';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { Observable } from 'rxjs';
import { combineLatest, Subject, defer, map, distinctUntilChanged, startWith, switchMap, of, catchError } from 'rxjs';
import type { Terms } from 'src/app/models/Terms';
import { LoadingComponent } from '../../share/loading/loading.component';
import { CommonModule } from '@angular/common';
import { LegalDocumentComponent } from '../legal-document/legal-document.component';
import { TranslatePipe } from '../../i18n/translate.pipe';

export type TermsViewState = { kind: 'loading' | 'not-found' | 'error' } | { kind: 'ready'; project: Terms };

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
  standalone: true,
  imports: [
    LoadingComponent,
    CommonModule, LegalDocumentComponent, TranslatePipe
  ]
})
export class TermsComponent {

  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly termsServices: TermsService = inject(TermsService)


  private readonly retryRequests = new Subject<void>();
  public readonly state: Observable<TermsViewState> = combineLatest([
    this.route.paramMap.pipe(map(params => params.get('projectID')), distinctUntilChanged()),
    this.retryRequests.pipe(startWith(undefined)),
  ]).pipe(switchMap(([projectId]) => {
    if (projectId === null || !/^[^/\u0000-\u001f]{1,1500}$/.test(projectId)
      || projectId === '.' || projectId === '..') return of<TermsViewState>({ kind: 'not-found' });
    return defer(() => this.termsServices.getTerms(projectId)).pipe(
      map((project): TermsViewState => project === null ? { kind: 'not-found' } : { kind: 'ready', project }),
      startWith<TermsViewState>({ kind: 'loading' }),
      catchError(() => of<TermsViewState>({ kind: 'error' })),
    );
  }));

  public retry(): void { this.retryRequests.next(); }

}
