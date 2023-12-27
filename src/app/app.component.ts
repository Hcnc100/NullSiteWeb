import { Component, OnInit } from '@angular/core';
import { ResizeService } from "./services/resize/resize.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Ricardo Pájaro Coatl';
  ngOnInit(): void {

  }



}
