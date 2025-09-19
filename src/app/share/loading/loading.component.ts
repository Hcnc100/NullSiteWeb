import { Component, Input, OnInit } from '@angular/core';
import { AnimationOptions, LottieComponent } from "ngx-lottie";

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  standalone: true,
  imports: [LottieComponent]
})
export class LoadingComponent implements OnInit {

  @Input() pathArg?: string;

  options?: AnimationOptions;


  ngOnInit(): void {
    this.options = {
      path: this.pathArg,
    };
  }
}
