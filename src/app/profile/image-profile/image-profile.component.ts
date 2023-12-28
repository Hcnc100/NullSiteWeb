import { Component, Input, OnInit } from '@angular/core';
import { AnimationOptions } from "ngx-lottie";

@Component({
  selector: 'app-image-profile',
  templateUrl: './image-profile.component.html',
  styleUrls: ['./image-profile.component.scss']
})
export class ImageProfileComponent {

  @Input() urlImgProfile: string | undefined;
  isLoading = true;
  options: AnimationOptions = {
    path: "assets/loading2.json",
  }



  changeLoad() {
    setTimeout(() => this.isLoading = false, 800);
  }

}
