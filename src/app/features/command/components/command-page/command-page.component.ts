import { Component } from '@angular/core';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-command-page',
    templateUrl: './command-page.component.html',
    styleUrls: ['./command-page.component.scss'],
    imports: [MatTabNav, MatTabLink, RouterLinkActive, RouterLink, MatTabNavPanel, RouterOutlet]
})
export class CommandPageComponent {
    tabLinks = [
        { label: 'Requests', link: './requests' },
        { label: 'Members', link: './members' },
        { label: 'Units', link: './units' },
        { label: 'Ranks', link: './ranks' },
        { label: 'Roles', link: './roles' },
        { label: 'Training', link: './training' }
    ];

    constructor() {}

    trackByLink(index: number, item: { link: string }): string {
        return item.link;
    }
}
