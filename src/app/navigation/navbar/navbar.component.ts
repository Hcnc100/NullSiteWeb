import type { Signal } from '@angular/core';
import { Component, effect, inject } from '@angular/core';
import type {
  IconDefinition
} from "@fortawesome/free-solid-svg-icons";
import {
  faBars,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";
import { ResizeService } from 'src/app/services/resize/resize.service';
import { navigatorSections } from "../../../utils/Constants";
import { NavigatorServices } from "../services/navigator.service";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [FaIconComponent, CommonModule, RouterLink]
})
export class NavbarComponent {

  private readonly resizeService: ResizeService = inject(ResizeService);
  private readonly navigator: NavigatorServices = inject(NavigatorServices);


  public readonly iconMenu: IconDefinition = faBars;
  public readonly iconBack: IconDefinition = faArrowLeft;
  public isMobile: boolean = false;
  public readonly currentIdSection: Signal<string> = this.navigator.currentSection;
  public isGoneMenu = true;
  public listIdsSections: string[] = Object.values(navigatorSections);

  public constructor() {
    effect(() => {
      if (!this.isMobile && !this.isGoneMenu) {
        this.isGoneMenu = true;
      }
      this.isMobile = this.resizeService.isMobileSize();
    });
  }





  public onClickMobile(): void {
    // * toggle menu mobile
    this.isGoneMenu = !this.isGoneMenu
  }

  public onClickBack(): void {
    // * go back
    window.history.back();
  }


  public hiddenMenuIfNeed(): void {
    if (!this.isGoneMenu) {
      this.isGoneMenu = true;
    }
  }

}
