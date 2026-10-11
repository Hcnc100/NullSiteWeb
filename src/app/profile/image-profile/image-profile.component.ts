import { Component, inject, input } from '@angular/core';
import { MotionService } from '../../services/motion/motion.service';
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
  public readonly motion = inject(MotionService);

  public readonly urlImgProfile = input.required<string>();

  public isLoading = true;
  public failed = false;

  public readonly options: AnimationOptions = {
    path: "assets/loading2.json",
  }

  public changeLoad(): void {
    this.isLoading = false;
  }
  public imageFailed(): void { this.isLoading = false; this.failed = true; }

}
