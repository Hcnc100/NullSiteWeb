import { Component, Input, OnInit } from '@angular/core';
import type { InfoProfile } from "../../models/InfoProfile";

@Component({
  selector: 'app-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss'],
  standalone: true
})
export class DescriptionComponent {

  @Input() infoProfile?: InfoProfile


}
