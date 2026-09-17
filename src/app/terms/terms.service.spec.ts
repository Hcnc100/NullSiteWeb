import { firebaseTestProviders } from 'src/app/testing/firebase-test.providers';
import { TestBed } from '@angular/core/testing';

import { TermsService } from './terms.service';

describe('TermsService', () => {
  let service: TermsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: firebaseTestProviders });
    service = TestBed.inject(TermsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});








