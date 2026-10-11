import type { Signal } from '@angular/core';
import { Component, effect, inject, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import type {
  IconDefinition
} from "@fortawesome/free-solid-svg-icons";
import {
  faBars,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";
import { ResizeService } from 'src/app/services/resize/resize.service';
import { navigatorSections } from "../../../utils/Constants";
import { NavigatorService } from "../services/navigator.service";
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PublicBlogService } from '../../blog/public-blog.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [FaIconComponent, CommonModule, RouterLink, TranslatePipe]
})
export class NavbarComponent {
  public readonly i18n = inject(I18nService);

  private readonly resizeService: ResizeService = inject(ResizeService);
  private readonly navigator: NavigatorService = inject(NavigatorService);


  public readonly iconMenu: IconDefinition = faBars;
  public readonly iconBack: IconDefinition = faArrowLeft;
  public isMobile: boolean = false;
  public readonly currentIdSection: Signal<string> = this.navigator.currentSection;
  public isGoneMenu = true;
  public readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly blog = inject(PublicBlogService);
  public get listIdsSections(): string[] {
    return [...Object.values(navigatorSections), ...(this.blog.enabled() ? ['blog'] : [])];
  }

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


  public hiddenMenuIfNeed(restoreFocus = false): void {
    if (!this.isGoneMenu) {
      this.isGoneMenu = true;
      if (restoreFocus) this.menuButton()?.nativeElement.focus();
    }
  }

}

