import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {ImageContactComponent} from './image-contact.component';

describe('ImageContactComponent', () => {
  let component: ImageContactComponent;
  let fixture: ComponentFixture<ImageContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImageContactComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ImageContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
