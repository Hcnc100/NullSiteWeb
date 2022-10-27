import {Certificate} from "../../models/Certificate";
import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-item-certificate',
  templateUrl: './item-certificate.component.html',
  styleUrls: ['./item-certificate.component.scss']
})
export class ItemCertificateComponent implements OnInit {

  @Input() certificate: Certificate | undefined;

  constructor() {
  }

  ngOnInit(): void {
  }
}
