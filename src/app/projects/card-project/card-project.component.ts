import { Project } from "../../models/Project";
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-project',
  templateUrl: './card-project.component.html',
  styleUrls: ['./card-project.component.scss']
})
export class CardProjectComponent {

  @Input() project?: Project;

  constructor() {
  }

}
