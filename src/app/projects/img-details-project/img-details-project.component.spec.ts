import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {ImgDetailsProjectComponent} from './img-details-project.component';

describe('ImgProjectComponent', () => {
  let component: ImgDetailsProjectComponent;
  let fixture: ComponentFixture<ImgDetailsProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImgDetailsProjectComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ImgDetailsProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
