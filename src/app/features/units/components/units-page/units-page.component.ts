import { Component } from '@angular/core';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-units-page',
    templateUrl: './units-page.component.html',
    styleUrls: ['./units-page.component.scss'],
    imports: [MatTabNav, MatTabLink, RouterLinkActive, RouterLink, MatTabNavPanel, RouterOutlet]
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
