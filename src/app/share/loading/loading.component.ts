import type { OnInit } from '@angular/core';
import { Component, inject, input, model } from '@angular/core';
import { MotionService } from '../../services/motion/motion.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import type { AnimationOptions } from "ngx-lottie";
import { LottieComponent } from "ngx-lottie";

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  standalone: true,
  imports: [LottieComponent, TranslatePipe]
})
export class LoadingComponent implements OnInit {
  public readonly motion = inject(MotionService);

  public readonly pathArg = input.required<string>();

  public readonly options = model<AnimationOptions>({});


  public ngOnInit(): void {
    this.options.update(
      () => ({ path: this.pathArg() })
    );
  }
}
