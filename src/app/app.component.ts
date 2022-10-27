import {Component, OnInit} from '@angular/core';
import {ResizeService} from "./services/resize/resize.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Ricardo Pájaro Coatl';

  constructor(
    private resizeService: ResizeService) {
  }

  ngOnInit(): void {
    this.resizeService.onResize(window.innerWidth);
  }

  onResize(event: any) {
    this.resizeService.onResize(event.target.innerWidth);
  }
}
