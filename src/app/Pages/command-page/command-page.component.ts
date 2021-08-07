import { Component } from '@angular/core';

@Component({
    selector: 'app-command-page',
    templateUrl: './command-page.component.html',
    styleUrls: ['./command-page.component.scss']
})
export class CommandPageComponent {
    tabLinks = [
        { label: 'Requests', link: '../requests' },
        { label: 'Members', link: '../members' },
        { label: 'Units', link: '../units' },
        { label: 'Ranks', link: '../ranks' },
        { label: 'Roles', link: '../roles' }
    ];

    constructor() {}
}
