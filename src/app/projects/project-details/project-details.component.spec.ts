import { DialogModule } from '@ngneat/dialog';
import { DialogRef } from '@ngneat/dialog';
import { firebaseTestProviders } from 'src/app/testing/firebase-test.providers';
import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {ProjectDetailsComponent} from './project-details.component';

describe('ProjectDetailsComponent', () => {
  let component: ProjectDetailsComponent;
  let fixture: ComponentFixture<ProjectDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetailsComponent, DialogModule.forRoot()],
      providers: [
        ...firebaseTestProviders,
        { provide: DialogRef, useValue: { data: { id: 'test', name: 'Test', description: '', urlImg: '', urlRepo: '', urlPlay: '', gallery: [] } } }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProjectDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});







