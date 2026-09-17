import { firebaseTestProviders } from 'src/app/testing/firebase-test.providers';
import {TestBed} from '@angular/core/testing';

import {EmailService} from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: firebaseTestProviders });
    service = TestBed.inject(EmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});








