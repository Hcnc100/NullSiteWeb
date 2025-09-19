import { Certificate } from "../../models/Certificate";
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-item-certificate',
  templateUrl: './item-certificate.component.html',
  styleUrls: ['./item-certificate.component.scss'],
  standalone: true
})
export class ItemCertificateComponent {

  @Input() certificate?: Certificate;

}
