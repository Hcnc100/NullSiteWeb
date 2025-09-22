import type { Certificate } from "../../models/Certificate";
import { Component, input } from '@angular/core';


@Component({
  selector: 'app-item-certificate',
  templateUrl: './item-certificate.component.html',
  styleUrls: ['./item-certificate.component.scss'],
  standalone: true
})
export class ItemCertificateComponent {

  public readonly certificate = input.required<Certificate>();

}
