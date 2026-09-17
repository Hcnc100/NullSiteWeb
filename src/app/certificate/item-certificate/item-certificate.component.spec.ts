import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {ItemCertificateComponent} from './item-certificate.component';

describe('ItemCertificateComponent', () => {
  let component: ItemCertificateComponent;
  let fixture: ComponentFixture<ItemCertificateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemCertificateComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ItemCertificateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});





