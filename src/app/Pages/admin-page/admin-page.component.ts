import { Component } from '@angular/core';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.css']
})
export class AdminPageComponent {
    tabLinks = [
        { label: 'Audit', link: '../audit' },
        { label: 'Errors', link: '../errors' },
        { label: 'Launcher', link: '../launcher' },
        { label: 'Logs', link: '../logs' },
        { label: 'Tools', link: '../tools' },
        { label: 'Variables', link: '../variables' }
    ];

    constructor() { }
}

export interface Log {
    id: string;
    partitionKey: string;
    timestamp: Date;
    message: string;
}
