import { firebaseTestProviders } from 'src/app/testing/firebase-test.providers';
import {TestBed} from '@angular/core/testing';

import {ProjectsService} from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: firebaseTestProviders });
    service = TestBed.inject(ProjectsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});








