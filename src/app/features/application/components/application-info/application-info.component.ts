import { Component, Output, EventEmitter } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { ButtonComponent } from '../../../../shared/components/elements/button-pending/button.component';

@Component({
    selector: 'app-application-info',
    templateUrl: './application-info.component.html',
    styleUrls: ['../application-page/application-page.component.scss', './application-info.component.scss'],
    imports: [MatCard, ButtonComponent]
})
export class ApplicationInfoComponent {
    @Output() nextEvent = new EventEmitter();

    constructor() {}

    next() {
        this.nextEvent.emit();
    }
}
