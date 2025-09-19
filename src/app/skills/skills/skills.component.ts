import { Observable } from "rxjs";
import { Component, OnInit } from '@angular/core';
import { ItemSkill } from "../../models/ItemSkill";
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

@Component({
    selector: 'app-skills',
    templateUrl: './skills.component.html',
    styleUrls: ['./skills.component.scss'],
    standalone: false
})
export class SkillsComponent {

  readonly listLanguages: ItemSkill[] = [
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

  readonly listTech: ItemSkill[] = [
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

  isMobile: Observable<boolean>

  constructor(private resizeServices: ResizeService) {
    this.isMobile = this.resizeServices.isMobileSize;
  }

  get allItems() {
    return [...this.listLanguages, ...this.listTech]
  }




}
