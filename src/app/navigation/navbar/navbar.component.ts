import { Component, OnInit } from '@angular/core';
import { faBars } from "@fortawesome/free-solid-svg-icons/faBars";
import { ResizeService } from 'src/app/services/resize/resize.service';
import { Observable, Subject, takeUntil } from "rxjs";
import { navigatorSections } from "../../../utils/Constants";
import { NavigatorServices } from "../services/navigator.service";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  iconMenu = faBars;
  isMobile: boolean = false;
  currentIdSection: Observable<string>;
  isGoneMenu = true;
  listIdsSections: string[];
  private destroy$ = new Subject<void>();


  constructor(
    private resizeService: ResizeService,
    private navigator: NavigatorServices,
  ) {
    // // * the first section always is the home
    this.listIdsSections = Object.values(navigatorSections);
    this.currentIdSection = navigator.currentSection;
    resizeService.isMobileSize
      .pipe(takeUntil(this.destroy$))
      .subscribe((isMenuMobile) => {
        if (!isMenuMobile && !this.isGoneMenu) {
          this.isGoneMenu = true;
        }
        this.isMobile = isMenuMobile;
      })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  ngOnInit(): void {
  }


  onClickMobile() {
    // * toggle menu mobile
    this.isGoneMenu = !this.isGoneMenu
  }


  hiddenMenuIfNeed() {
    if (!this.isGoneMenu) {
      this.isGoneMenu = true;
    }
  }

}
