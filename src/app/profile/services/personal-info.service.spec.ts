import { firebaseTestProviders } from 'src/app/testing/firebase-test.providers';
import {TestBed} from '@angular/core/testing';

import {PersonalInfoService} from './personal-info.service';

describe('PersonalInfoService', () => {
  let service: PersonalInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: firebaseTestProviders });
    service = TestBed.inject(PersonalInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});








