import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faFolderOpen, faCode, faFileArrowDown, faNewspaper, faScaleBalanced, faArrowUpRightFromSquare, faPlus, faRotateRight, faPen, faTrash, faFloppyDisk, faXmark, faImage, faEye, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

const icons = { profile: faUser, projects: faFolderOpen, skills: faCode, resume: faFileArrowDown,
  blog: faNewspaper, legal: faScaleBalanced, external: faArrowUpRightFromSquare, add: faPlus,
  reload: faRotateRight, edit: faPen, remove: faTrash, save: faFloppyDisk, cancel: faXmark,
  image: faImage, preview: faEye, logout: faRightFromBracket };

@Component({
  selector: 'app-admin-icon', standalone: true, imports: [FontAwesomeModule],
  template: '<fa-icon [icon]="icons[name()]" aria-hidden="true" />',
  styles: [':host{display:inline-flex;align-items:center;justify-content:center;width:1.1em;flex-shrink:0;margin-inline-end:.5em}'],
})
export class AdminIconComponent {
  public readonly name = input.required<keyof typeof icons>();
  public readonly icons = icons;
}
