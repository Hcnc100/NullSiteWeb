import {Observable} from "rxjs";
import {Component, OnInit} from '@angular/core';
import {ItemSkill} from "../../models/ItemSkill";
import {ResizeService} from "../../services/resize/resize.service";
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
  styleUrls: ['./skills.component.scss']
})
export class SkillsComponent implements OnInit {

  listLanguages: ItemSkill[] = [
    new ItemSkill(
      "Python",
      faPython,
      "#306998",
    ),
    new ItemSkill(
      "Java",
      faJava,
      "#f89820",
    ), new ItemSkill(
      "JavaScript",
      faJsSquare,
      "#f0db4f",
    )
    , new ItemSkill(
      "Kotlin",
      faAndroid,
      "#78C257",
    ),
    new ItemSkill(
      "Dart",
      faAndroid,
      "#78C257",
    ),
    new ItemSkill(
      "Angular",
      faAngular,
      "#a6120d",
    ),
  ]

  listTech = [
    new ItemSkill(
      "Github",
      faGithub,
      "#6e5494",
    ),
    new ItemSkill(
      "Git",
      faGit,
      "#f34f29",
    ),
    new ItemSkill(
      "Docker",
      faDocker,
      "#0db7ed",
    )
  ]

  isMobile: Observable<boolean>

  constructor(private resizeServices: ResizeService) {
    this.isMobile = this.resizeServices.isMobileSize;
  }

  get allItems() {
    return [...this.listLanguages, ...this.listTech]
  }


  ngOnInit(): void {
  }

}
