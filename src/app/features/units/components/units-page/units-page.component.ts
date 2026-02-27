import { Component } from '@angular/core';

@Component({
    selector: 'app-units-page',
    templateUrl: './units-page.component.html',
    styleUrls: ['./units-page.component.scss'],
    standalone: false
})
export class UnitsPageComponent {
    tabLinks = [
        { label: 'ORBAT', link: './orbat' },
        { label: 'Secondary ORBAT', link: './secondary' },
        { label: 'Auxiliary ORBAT', link: './auxiliary' }
    ];

    constructor() {}

    trackByLink(index: number, item: { link: string }): string {
        return item.link;
    }
}
