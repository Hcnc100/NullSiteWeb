import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ErrorAndMessage } from 'src/app/models/ErrorAndMessage';

@Component({
  selector: 'app-count-and-error-field',
  templateUrl: './count-and-error-field.component.html',
  styleUrls: ['./count-and-error-field.component.scss']
})
export class CountAndErrorFieldComponent {

  @Input() control: FormControl | undefined;
  @Input() maxCount: number | undefined;
  @Input() errorsList: ErrorAndMessage[] | undefined;


  constructor() { }



}
