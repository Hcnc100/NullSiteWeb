import type { Project } from "../../models/Project";
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card-project',
  templateUrl: './card-project.component.html',
  styleUrls: ['./card-project.component.scss'],
  standalone: true
})
export class CardProjectComponent {

  public readonly project = input.required<Project>();

}
