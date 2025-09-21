import { Component, Input, OnInit } from '@angular/core';
import type { ItemSkill } from "../../models/ItemSkill";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skill-card',
  templateUrl: './skill-card.component.html',
  styleUrls: ['./skill-card.component.scss'],
  standalone: true,
  imports: [FaIconComponent, CommonModule],
})
export class SkillCardComponent {

  @Input() itemSkill?: ItemSkill;


}
