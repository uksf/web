import { Component } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';

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

    constructor(private permissions: NgxPermissionsService) { }
}
