import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import type { FormControl } from '@angular/forms';
import type { ErrorAndMessage } from 'src/app/models/ErrorAndMessage';

@Component({
  selector: 'app-count-and-error-field',
  templateUrl: './count-and-error-field.component.html',
  styleUrls: ['./count-and-error-field.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class CountAndErrorFieldComponent {

  public readonly control = input.required<FormControl>();
  public readonly maxCount = input.required<number>();
  public readonly errorsList = input.required<ErrorAndMessage[]>();

}
