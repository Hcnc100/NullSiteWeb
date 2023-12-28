import { Component, Input, OnInit } from '@angular/core';
import { InfoProfile } from "../../models/InfoProfile";

@Component({
  selector: 'app-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss']
})
export class DescriptionComponent {

  @Input() infoProfile: InfoProfile | undefined


}
