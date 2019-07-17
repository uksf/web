import { Component } from '@angular/core';

@Component({
    selector: 'app-units-page',
    templateUrl: './units-page.component.html',
    styleUrls: ['./units-page.component.scss']
})
export class UnitsPageComponent {
    tabLinks = [
        { label: 'ORBAT', link: '../orbat' },
        { label: 'Auxiliary ORBAT', link: '../auxiliary' },
        { label: 'Roster', link: '../roster' }
    ];

    constructor() {}
}
