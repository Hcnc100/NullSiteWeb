import { Component, inject, Signal } from '@angular/core';
import { DialogService } from "@ngneat/dialog";
import { ProjectDetailsComponent } from "../project-details/project-details.component";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import type { Project } from "../../models/Project";
import { ProjectsService } from "../services/projects.service";
import { CardProjectComponent } from '../card-project/card-project.component';
import { LoadingComponent } from 'src/app/share/loading/loading.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  standalone: true,
  imports: [
    CardProjectComponent,
    LoadingComponent,
    CommonModule
  ]
})
export class ProjectsComponent {

  private readonly projectServices: ProjectsService = inject(ProjectsService);
  private readonly dialog: DialogService = inject(DialogService);

  public readonly listProjectId = "listProjectId"
  public readonly icon = faGithub;

  public readonly listProjects: Signal<Project[] | undefined> = this.projectServices.listProjects;


  public clickOnProject(project: Project): void {
    this.dialog.open(ProjectDetailsComponent,
      {
        closeButton: false,
        data: project
      });
  }


}
