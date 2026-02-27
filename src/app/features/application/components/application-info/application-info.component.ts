import { Component, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-application-info',
    templateUrl: './application-info.component.html',
    styleUrls: ['../application-page/application-page.component.scss', './application-info.component.scss'],
    standalone: false
})
export class ApplicationInfoComponent {
    @Output() nextEvent = new EventEmitter();

    constructor() {}

    next() {
        this.nextEvent.emit();
    }
}
