import { Dialog } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import { CertificatesService } from "../services/certificates.service";
import { ItemCertificateComponent } from "../item-certificate/item-certificate.component";
import { LoadingComponent } from "src/app/share/loading/loading.component";
import type { Certificate } from "src/app/models/Certificate";
import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { ImageViewerComponent } from '../../share/image-viewer/image-viewer.component';
import { PUBLIC_DIALOG_CONFIG } from '../../share/image-viewer/public-dialog.config';
import { isHttpsUrl } from '../../models/profile-editor.model';

@Component({
  selector: 'app-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.scss'],
  standalone: true,
  imports: [
    ItemCertificateComponent,
    LoadingComponent,
    TranslatePipe
  ],
})
export class CertificateComponent {

  private readonly dialog = inject(Dialog);
  private readonly i18n = inject(I18nService);
  private readonly certificatesService: CertificatesService = inject(CertificatesService);
  public readonly listCertificateId: string = "listCertificateId"

  public readonly listCertificates = this.certificatesService.listCertificates;

  public openCertificate(certificate: Certificate): void {
    const certificates = (this.listCertificates() ?? []).filter(item => isHttpsUrl(item.urlCertificate));
    const index = certificates.indexOf(certificate);
    if (index < 0) return;
    this.dialog.open(ImageViewerComponent, {
      ...PUBLIC_DIALOG_CONFIG,
      ariaLabelledBy: 'image-dialog-title',
      data: {
        title: this.i18n.text('Certificates'),
        images: certificates.map(item => ({ url: item.urlCertificate, alt: item.name })),
        index,
      },
    });
  }

}

