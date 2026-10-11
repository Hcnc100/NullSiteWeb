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

  it('reserves image space and uses the certificate name as alternative text', () => {
    fixture.componentRef.setInput('certificate', { name: 'Kotlin', urlCertificate: 'https://example.invalid/certificate.jpg' });
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image.alt).toBe('Kotlin');
    expect(image.width).toBeGreaterThan(0);
    expect(image.getAttribute('loading')).toBe('lazy');
  });
});





