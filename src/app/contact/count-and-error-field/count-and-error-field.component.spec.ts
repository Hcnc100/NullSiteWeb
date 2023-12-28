import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountAndErrorFieldComponent } from './count-and-error-field.component';

describe('CountAndErrorFieldComponent', () => {
  let component: CountAndErrorFieldComponent;
  let fixture: ComponentFixture<CountAndErrorFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CountAndErrorFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountAndErrorFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
