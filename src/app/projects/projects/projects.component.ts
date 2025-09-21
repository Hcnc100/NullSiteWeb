import { Component, OnDestroy, OnInit } from '@angular/core';
import type { DialogService } from "@ngneat/dialog";
import { ProjectDetailsComponent } from "../project-details/project-details.component";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import type { Project } from "../../models/Project";
import type { ProjectsService } from "../services/projects.service";
import type { Observable } from "rxjs";
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

  readonly listProjectId = "listProjectId"
  readonly icon = faGithub;

  listProjectsAsync: Observable<Project[]>;

  constructor(
    private readonly projectServices: ProjectsService,
    private readonly dialog: DialogService,
  ) {
    this.listProjectsAsync = projectServices.listProjects
  }


  clickOnProject(project: Project) {
    this.dialog.open(ProjectDetailsComponent,
      {
        closeButton: false,
        data: project
      });
  }


}
