import {InfoProfile} from "../../models/InfoProfile";
import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss']
})
export class DescriptionComponent implements OnInit {

  @Input() infoProfile: InfoProfile | undefined

  constructor() {
  }

  ngOnInit(): void {
  }

}
