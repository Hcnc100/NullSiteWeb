import { Component } from '@angular/core';
import { ImageContactComponent } from '../image-contact/image-contact.component';
import { FormContactComponent } from '../form-contact/form-contact.component';
import { ResumeDownloadComponent } from '../../resume/resume-download.component';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    standalone: true,
    imports: [
        ImageContactComponent,
        FormContactComponent, ResumeDownloadComponent, TranslatePipe
    ]
})
export class ContactComponent {


}
