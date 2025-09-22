import { Component, input } from '@angular/core';
import type { AnimationOptions } from "ngx-lottie";
import { LottieComponent } from "ngx-lottie";

@Component({
  selector: 'app-image-profile',
  templateUrl: './image-profile.component.html',
  styleUrls: ['./image-profile.component.scss'],
  standalone: true,
  imports: [
    LottieComponent
  ]
})
export class ImageProfileComponent {

  public readonly urlImgProfile = input.required<string>();

  public isLoading = true;

  public readonly options: AnimationOptions = {
    path: "assets/loading2.json",
  }

  public changeLoad(): void {
    setTimeout(() => this.isLoading = false, 800);
  }

}
