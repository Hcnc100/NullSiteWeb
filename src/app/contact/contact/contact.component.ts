import { Component } from '@angular/core';
import { ImageContactComponent } from '../image-contact/image-contact.component';
import { FormContactComponent } from '../form-contact/form-contact.component';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    standalone: true,
    imports: [
        ImageContactComponent,
        FormContactComponent
    ]
})
export class ContactComponent {


}
