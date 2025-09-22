import { Component, input } from '@angular/core';

@Component({
  selector: 'app-img-details-project',
  templateUrl: './img-details-project.component.html',
  styleUrls: ['./img-details-project.component.scss'],
  standalone: true
})
export class ImgDetailsProjectComponent {

  public readonly urlImgProject = input.required<string>();
  public readonly indexScreenshots = input.required<number>();



}
