import { firebaseTestProviders } from 'src/app/testing/firebase-test.providers';
import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {PersonalLinksComponent} from './personal-links.component';

describe('PersonalLinksComponent', () => {
  let component: PersonalLinksComponent;
  let fixture: ComponentFixture<PersonalLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalLinksComponent],
      providers: firebaseTestProviders
    })
      .compileComponents();

    fixture = TestBed.createComponent(PersonalLinksComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});








