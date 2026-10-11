import { vi } from 'vitest';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { CertificatesService } from '../services/certificates.service';
import { I18nService } from '../../i18n/i18n.service';
import type {ComponentFixture} from '@angular/core/testing';
import { TestBed} from '@angular/core/testing';

import {CertificateComponent} from './certificate.component';

describe('CertificateComponent', () => {
  let component: CertificateComponent;
  let fixture: ComponentFixture<CertificateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateComponent, DialogModule],
      providers: [provideRouter([]), { provide: CertificatesService, useValue: {
        listCertificates: signal([{ name: 'Kotlin', urlCertificate: 'https://example.invalid/kotlin.jpg' },
          { name: 'Invalid', urlCertificate: 'javascript:alert(1)' }]),
      } }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CertificateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens certificates using the accessible viewer and excludes unsafe image URLs', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    const open = vi.spyOn(TestBed.inject(Dialog), 'open');
    fixture.nativeElement.querySelector('button.certificate-button').click();
    expect(open).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
      ariaLabelledBy: 'image-dialog-title', ariaModal: true,
      data: { title: TestBed.inject(I18nService).text('Certificates'),
        images: [{ url: 'https://example.invalid/kotlin.jpg', alt: 'Kotlin' }], index: 0 },
    }));
    open.mockClear();
    component.openCertificate(component.listCertificates()![1]);
    expect(open).not.toHaveBeenCalled();
  });
});








