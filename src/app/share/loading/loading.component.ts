import { Component, Input, OnInit } from '@angular/core';
import { AnimationOptions } from "ngx-lottie";

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit {

  @Input() pathArg: string | undefined;

  options: AnimationOptions | undefined;

  constructor() {
  }

  ngOnInit(): void {
    this.options = {
      path: this.pathArg,
    };
  }
}
