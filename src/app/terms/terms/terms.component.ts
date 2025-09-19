import { DomSanitizer } from '@angular/platform-browser';
import { TermsService } from './../terms.service';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, tap, switchMap, of, catchError, finalize } from 'rxjs';
import { Terms } from 'src/app/models/Terms';
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

  termsProject?: Observable<Terms | null>;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private termsServices: TermsService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.termsProject = this.route.paramMap.pipe(
      switchMap(params => {
        const projectId = params.get('projectID');
        if (projectId) {
          return this.termsServices.getTerms(projectId).pipe(
            catchError(error => this.handleError(error)),
            finalize(() => this.isLoading = false)
          );
        } else {
          return of(null).pipe(
            tap(() => console.error('No se proporcionó un projectId')),
            tap(() => this.isLoading = false)
          );
        }
      })
    );
  }

  getSafeContent(content: string) {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  private handleError(error: any): Observable<null> {
    console.error('Error al obtener los términos:', error);
    return of(null);
  }

}