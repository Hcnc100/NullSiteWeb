import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { CountAndErrorFieldComponent } from './count-and-error-field.component';

describe('CountAndErrorFieldComponent', () => {
  let component: CountAndErrorFieldComponent;
  let fixture: ComponentFixture<CountAndErrorFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ CountAndErrorFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CountAndErrorFieldComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});





