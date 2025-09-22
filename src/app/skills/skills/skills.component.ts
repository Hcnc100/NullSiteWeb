import type { Observable } from "rxjs";
import { Component, inject } from '@angular/core';
import type { ItemSkill } from "../../models/ItemSkill";
import { ResizeService } from "../../services/resize/resize.service";
import {
  faAndroid,
  faAngular,
  faDocker,
  faGit,
  faGithub,
  faJava,
  faJsSquare,
  faPython
} from "@fortawesome/free-brands-svg-icons";
import { SkillCardComponent } from "../skill-card/skill-card.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss'],
  standalone: true,
  imports: [
    SkillCardComponent,
    CommonModule
  ]
})
export class SkillsComponent {

  private readonly resizeServices: ResizeService = inject(ResizeService);

  public readonly listLanguages: ItemSkill[] = [
    {
      name: "Python",
      icon: faPython,
      color: "#306998",
    },
    {
      name: "Java",
      icon: faJava,
      color: "#f89820",
    }, {
      name: "JavaScript",
      icon: faJsSquare,
      color: "#f0db4f",
    }
    , {
      name: "Kotlin",
      icon: faAndroid,
      color: "#78C257",
    },
    {
      name: "Dart",
      icon: faAndroid,
      color: "#78C257",
    },
    {
      name: "Angular",
      icon: faAngular,
      color: "#a6120d",
    },
  ]

  public readonly listTech: ItemSkill[] = [
    {
      name: "Github",
      icon: faGithub,
      color: "#6e5494",
    },
    {
      name: "Git",
      icon: faGit,
      color: "#f34f29",
    },
    {
      name: "Docker",
      icon: faDocker,
      color: "#0db7ed",
    }
  ]

  public isMobile: Observable<boolean> = this.resizeServices.isMobileSize;

  public get allItems(): ItemSkill[] {
    return [...this.listLanguages, ...this.listTech]
  }




}
