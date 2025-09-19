import { Component, Input, OnInit } from '@angular/core';
import { ItemSkill } from "../../models/ItemSkill";

@Component({
  selector: 'app-skill-card',
  templateUrl: './skill-card.component.html',
  styleUrls: ['./skill-card.component.scss'],
  standalone: true
})
export class SkillCardComponent {

  @Input() itemSkill?: ItemSkill;


}
