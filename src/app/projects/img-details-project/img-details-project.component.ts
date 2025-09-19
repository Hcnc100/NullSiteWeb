import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-img-details-project',
  templateUrl: './img-details-project.component.html',
  styleUrls: ['./img-details-project.component.scss'],
  standalone: true
})
export class ImgDetailsProjectComponent implements OnInit {

  @Input() urlImgProject?: string;
  @Input() indexScreenshots?: number;

  constructor() {
  }

  ngOnInit(): void {
  }


}
