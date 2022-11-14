import { Component, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-application-info',
    templateUrl: './application-info.component.html',
    styleUrls: ['../../../Pages/application-page/application-page.component.scss', './application-info.component.scss']
})
export class ApplicationInfoComponent {
    @Output() nextEvent = new EventEmitter();

    constructor() {}

    next() {
        this.nextEvent.emit();
    }
}
