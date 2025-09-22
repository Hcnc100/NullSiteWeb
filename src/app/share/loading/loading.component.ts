import type { OnInit } from '@angular/core';
import { Component, input, model } from '@angular/core';
import type { AnimationOptions } from "ngx-lottie";
import { LottieComponent } from "ngx-lottie";

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  standalone: true,
  imports: [LottieComponent]
})
export class LoadingComponent implements OnInit {

  public readonly pathArg = input.required<string>();

  public readonly options = model<AnimationOptions>({});


  public ngOnInit(): void {
    this.options.update(
      () => ({ path: this.pathArg() })
    );
  }
}
