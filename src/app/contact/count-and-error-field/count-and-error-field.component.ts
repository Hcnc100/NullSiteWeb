import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import type { FormControl} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
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

  @Input() control?: FormControl;
  @Input() maxCount?: number;
  @Input() errorsList?: ErrorAndMessage[];



}
