import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LoadingComponent} from "./loading/loading.component";
import {LottieModule} from 'ngx-lottie';
import player from 'lottie-web';

export function playerFactory() {
  return player;
}


@NgModule({
  declarations: [
    LoadingComponent,
  ],
  imports: [
    CommonModule,
    LottieModule.forRoot({player: playerFactory}),
  ],
  exports: [
    LoadingComponent,
  ]
})
export class ShareModule {
}
