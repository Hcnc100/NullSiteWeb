import type { Signal } from '@angular/core';
import { Component, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { ProjectDetailsComponent } from "../project-details/project-details.component";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import type { Project } from "../../models/Project";
import { ProjectsService } from "../services/projects.service";
import { CardProjectComponent } from '../card-project/card-project.component';
import { LoadingComponent } from 'src/app/share/loading/loading.component';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PUBLIC_DIALOG_CONFIG } from '../../share/image-viewer/public-dialog.config';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  standalone: true,
  imports: [
    CardProjectComponent,
    LoadingComponent,
    CommonModule,
    TranslatePipe,
  ]
})
export class ProjectsComponent {

  private readonly projectServices: ProjectsService = inject(ProjectsService);
  private readonly dialog = inject(Dialog);

  public readonly listProjectId = "listProjectId"
  public readonly icon = faGithub;

  public readonly listProjects: Signal<Project[] | undefined> = this.projectServices.listProjects;


  public clickOnProject(project: Project): void {
    this.dialog.open(ProjectDetailsComponent,
      {
        ...PUBLIC_DIALOG_CONFIG,
        ariaLabelledBy: 'project-dialog-title',
        data: project
      });
  }


}
