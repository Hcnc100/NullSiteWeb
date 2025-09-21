import type { OnInit } from '@angular/core';
import { Component, Input } from '@angular/core';
import type { AnimationOptions} from "ngx-lottie";
import { LottieComponent } from "ngx-lottie";

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
