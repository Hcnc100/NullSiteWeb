import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {ImageProfileComponent} from './image-profile.component';

describe('ImageProfileComponent', () => {
  let component: ImageProfileComponent;
  let fixture: ComponentFixture<ImageProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImageProfileComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ImageProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
