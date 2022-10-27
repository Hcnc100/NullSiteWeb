import {Component, Input, OnInit} from '@angular/core';
import {AnimationOptions} from "ngx-lottie";

@Component({
  selector: 'app-image-profile',
  templateUrl: './image-profile.component.html',
  styleUrls: ['./image-profile.component.scss']
})
export class ImageProfileComponent implements OnInit {

  @Input() urlImgProfile: string = ""
  isLoading = true;
  options: AnimationOptions = {
    path: "assets/loading2.json",
  }


  constructor() {
  }

  ngOnInit(): void {
  }

  changeLoad() {
    setTimeout(() => this.isLoading = false, 800);
  }

}
