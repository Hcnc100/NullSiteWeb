import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';

export interface ImageViewerData {
  title: string;
  images: readonly { url: string; alt: string }[];
  index: number;
}

@Component({
  selector: 'app-image-viewer', standalone: true, imports: [TranslatePipe],
  templateUrl: './image-viewer.component.html', styleUrl: './image-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewerComponent {
  public readonly data = inject<ImageViewerData>(DIALOG_DATA);
  public readonly dialogRef = inject(DialogRef);
  public readonly index = signal(Math.max(0, Math.min(this.data.index, this.data.images.length - 1)));

  public move(offset: number): void {
    const next = this.index() + offset;
    if (next >= 0 && next < this.data.images.length) this.index.set(next);
  }
}
