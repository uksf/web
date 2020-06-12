import { Component } from '@angular/core';

@Component({
    selector: 'app-command-page',
    templateUrl: './command-page.component.html',
    styleUrls: ['./command-page.component.css']
})
export class CommandPageComponent {
    tabLinks = [
        { label: 'Requests', link: '../requests' },
        { label: 'Units', link: '../units' },
        { label: 'Ranks', link: '../ranks' },
        { label: 'Roles', link: '../roles' }
    ];

    constructor() { }
}
