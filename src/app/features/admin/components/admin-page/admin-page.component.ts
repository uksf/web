import { Component } from '@angular/core';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
    imports: [MatTabNav, MatTabLink, RouterLinkActive, RouterLink, MatTabNavPanel, RouterOutlet]
})
export class AdminPageComponent {
    tabLinks = [
        { label: 'Audit', link: '../audit' },
        { label: 'Errors', link: '../errors' },
        // { label: 'Launcher', link: '../launcher' },
        { label: 'Logs', link: '../logs' },
        { label: 'Discord', link: '../discord' },
        { label: 'Tools', link: '../tools' },
        { label: 'Variables', link: '../variables' },
        { label: 'Servers', link: '../servers' }
    ];

    constructor() {}

    trackByLink(index: number, item: { link: string }): string {
        return item.link;
    }
}
