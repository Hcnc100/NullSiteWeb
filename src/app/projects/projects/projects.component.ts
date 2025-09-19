import { Component, OnDestroy, OnInit } from '@angular/core';
import { DialogService } from "@ngneat/dialog";
import { ProjectDetailsComponent } from "../project-details/project-details.component";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { Project } from "../../models/Project";
import { ProjectsService } from "../services/projects.service";
import { Observable } from "rxjs";

@Component({
    selector: 'app-projects',
    templateUrl: './projects.component.html',
    styleUrls: ['./projects.component.scss'],
    standalone: false
})
export class ProjectsComponent {

  readonly listProjectId = "listProjectId"
  readonly icon = faGithub;

  listProjectsAsync: Observable<Project[]>;

  constructor(
    private projectServices: ProjectsService,
    private dialog: DialogService,
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
