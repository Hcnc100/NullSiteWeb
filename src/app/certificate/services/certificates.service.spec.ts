import { firebaseTestProviders } from 'src/app/testing/firebase-test.providers';
import { TestBed } from '@angular/core/testing';

import { CertificatesService } from './certificates.service';

describe('CertificatesService', () => {
  let service: CertificatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: firebaseTestProviders });
    service = TestBed.inject(CertificatesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});








