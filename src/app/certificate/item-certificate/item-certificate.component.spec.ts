import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ItemCertificateComponent} from './item-certificate.component';

describe('ItemCertificateComponent', () => {
  let component: ItemCertificateComponent;
  let fixture: ComponentFixture<ItemCertificateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ItemCertificateComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ItemCertificateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
