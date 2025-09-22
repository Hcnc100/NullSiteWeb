import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TermsService } from './../terms.service';
import type { OnInit } from '@angular/core';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { Observable } from 'rxjs';
import { tap, switchMap, of, catchError, finalize } from 'rxjs';
import type { Terms } from 'src/app/models/Terms';
import { LoadingComponent } from '../../share/loading/loading.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    LoadingComponent,
    CommonModule
  ]
})
export class TermsComponent implements OnInit {

  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly termsServices: TermsService = inject(TermsService)
  private readonly sanitizer: DomSanitizer = inject(DomSanitizer);


  public termsProject?: Observable<Terms | null>;
  public isLoading = true;


  public ngOnInit(): void {
    this.termsProject = this.route.paramMap.pipe(
      switchMap(params => {
        const projectId = params.get('projectID');
        if (projectId != null) {
          return this.termsServices.getTerms(projectId).pipe(
            catchError(error => this.handleError(error)),
            finalize(() => this.isLoading = false)
          );
        } else {
          return of(null).pipe(
            tap(() => this.isLoading = false)
          );
        }
      })
    );
  }

  public getSafeContent(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  private handleError(_: unknown): Observable<null> {
    return of(null);
  }

}