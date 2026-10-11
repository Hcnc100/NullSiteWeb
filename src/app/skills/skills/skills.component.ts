import type { Signal } from '@angular/core';
import { Component, inject } from '@angular/core';
import type { ItemSkill } from "../../models/ItemSkill";
import { ResizeService } from "../../services/resize/resize.service";
import { SkillCardComponent } from "../skill-card/skill-card.component";
import { CommonModule } from "@angular/common";
import { SkillsService } from '../skills.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss'],
  standalone: true,
  imports: [
    SkillCardComponent,
    CommonModule,
    TranslatePipe,
  ]
})
export class SkillsComponent {

  private readonly resizeServices: ResizeService = inject(ResizeService);
  private readonly skillsService = inject(SkillsService);

  public readonly isMobile: Signal<boolean> = this.resizeServices.isMobileSize;

  public get listLanguages(): ItemSkill[] {
    return this.skillsService.items().filter(skill => skill.category === 'language').map(skill => skill.item);
  }
  public get listTech(): ItemSkill[] {
    return this.skillsService.items().filter(skill => skill.category !== 'language').map(skill => skill.item);
  }

  public get allItems(): ItemSkill[] {
    return [...this.listLanguages, ...this.listTech]
  }




}
