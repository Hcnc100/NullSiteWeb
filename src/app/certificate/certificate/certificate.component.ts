import { Gallery, ImageItem } from "ng-gallery";
import { map, Observable, Subject, Subscription, takeUntil } from "rxjs";
import { Certificate } from "../../models/Certificate";
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CertificatesService } from "../services/certificates.service";

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.scss'],
  standalone: true
})
export class CertificateComponent implements OnInit, OnDestroy {

  readonly galleryId: string = "GalleryCertificates"
  readonly listenerCertificate: Subscription;

  readonly listCertificatesAsync: Observable<Certificate[]>;
  readonly listCertificateId = "listCertificateId"

  private readonly destroy$ = new Subject<void>();

  constructor(
    private gallery: Gallery,
    certificates: CertificatesService,
  ) {
    // * init gallery
    const galleryCertificate = this.gallery.ref(this.galleryId)

    // * init listener for certificates
    this.listCertificatesAsync = certificates.listCertificates;
    this.listenerCertificate = certificates.listCertificates.pipe(
      map(listCertificate => listCertificate.map(
        certificate => new ImageItem(
          {
            src: certificate.urlCertificate,
            thumb: certificate.urlCertificate
          }
        )
      )),
      takeUntil(this.destroy$),
    ).subscribe(listImages => {
      galleryCertificate.load(listImages)
    })
  }


  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
