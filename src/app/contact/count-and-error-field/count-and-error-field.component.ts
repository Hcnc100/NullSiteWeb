import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ErrorAndMessage } from 'src/app/models/ErrorAndMessage';

@Component({
    selector: 'app-count-and-error-field',
    templateUrl: './count-and-error-field.component.html',
    styleUrls: ['./count-and-error-field.component.scss'],
    standalone: false
})
export class CountAndErrorFieldComponent {

  @Input() control?: FormControl;
  @Input() maxCount?: number;
  @Input() errorsList?: ErrorAndMessage[];



}
