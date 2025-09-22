import { Gallery } from "ng-gallery";
import { ImageItem } from "ng-gallery";
import type { Observable } from "rxjs";
import { map } from "rxjs";
import type { Certificate } from "../../models/Certificate";
import type { OnInit } from '@angular/core';
import { Component, DestroyRef, inject } from '@angular/core';
import { CertificatesService } from "../services/certificates.service";
import { ItemCertificateComponent } from "../item-certificate/item-certificate.component";
import { LoadingComponent } from "src/app/share/loading/loading.component";
import { AsyncPipe } from "@angular/common";
import { LightboxModule } from "ng-gallery/lightbox";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.scss'],
  standalone: true,
  imports: [
    ItemCertificateComponent,
    LoadingComponent,
    AsyncPipe,
    LightboxModule
  ],
})
export class CertificateComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly gallery: Gallery = inject(Gallery);
  private readonly certificatesService: CertificatesService = inject(CertificatesService);

  public readonly galleryId: string = "GalleryCertificates"

  public listCertificatesAsync?: Observable<Certificate[]>;
  public listCertificateId = "listCertificateId"



  public ngOnInit(): void {
    // * init gallery
    const galleryCertificate = this.gallery.ref(this.galleryId)

    // * init listener for certificates
    this.listCertificatesAsync = this.certificatesService.listCertificates;
    this.certificatesService.listCertificates.pipe(
      map(listCertificate => listCertificate.map(
        certificate => new ImageItem(
          {
            src: certificate.urlCertificate,
            thumb: certificate.urlCertificate
          }
        )
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(listImages => {
      galleryCertificate.load(listImages)
    })
  }

}
