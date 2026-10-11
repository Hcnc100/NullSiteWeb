import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {DescriptionComponent} from './description.component';
import { ResumeService } from '../../resume/resume.service';
import { provideRouter } from '@angular/router';

describe('DescriptionComponent', () => {
  let component: DescriptionComponent;
  let fixture: ComponentFixture<DescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescriptionComponent],
      providers: [provideRouter([]), { provide: ResumeService, useValue: { resume: () => undefined } }],
    })
      .compileComponents();

    fixture = TestBed.createComponent(DescriptionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});





