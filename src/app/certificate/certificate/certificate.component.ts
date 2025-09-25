import { Gallery } from "ng-gallery";
import { ImageItem } from "ng-gallery";
import { Component, computed, effect, inject } from '@angular/core';
import { CertificatesService } from "../services/certificates.service";
import { ItemCertificateComponent } from "../item-certificate/item-certificate.component";
import { LoadingComponent } from "src/app/share/loading/loading.component";
import { LightboxModule } from "ng-gallery/lightbox";

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.scss'],
  standalone: true,
  imports: [
    ItemCertificateComponent,
    LoadingComponent,
    LightboxModule
  ],
})
export class CertificateComponent {

  private readonly gallery: Gallery = inject(Gallery);
  private readonly certificatesService: CertificatesService = inject(CertificatesService);
  public readonly galleryId: string = "GalleryCertificates"
  public readonly listCertificateId: string = "listCertificateId"

  public readonly listCertificates = computed(() =>
    this.certificatesService.listCertificates()?.map(certificate => ({
      certificate,
      imageItem: new ImageItem({
        src: certificate.urlCertificate,
        thumb: certificate.urlCertificate,
      }),
    }))
  );


  public constructor() {
    effect(() => {
      const currentList = this.listCertificates();
      if (!currentList || currentList.length === 0) {
        return;
      }

      const listImages = currentList.map(item => item.imageItem);
      this.gallery.ref(this.galleryId).load(listImages);
    });
  }

}

