import { Component, input } from '@angular/core';
import type { InfoProfile } from "../../models/InfoProfile";

@Component({
  selector: 'app-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss'],
  standalone: true
})
export class DescriptionComponent {

  public readonly infoProfile = input.required<InfoProfile>();


}
