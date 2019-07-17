import { Component } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { Permissions } from 'app/Services/permissions';

@Component({
    selector: 'app-operations-page',
    templateUrl: './operations-page.component.html',
    styleUrls: ['./operations-page.component.scss']
})
export class OperationsPageComponent {
    tabLinks = [
        { label: 'OPORDs', link: '../opords' },
        { label: 'OPREPs', link: '../opreps' },
        { label: 'Activity', link: '../activity' }
    ];

    constructor(private permissions: NgxPermissionsService) {
        const grantedPermissions = this.permissions.getPermissions();
        if (grantedPermissions[Permissions.SERVERS]) {
            this.tabLinks = [
                { label: 'Servers', link: '../servers' },
                { label: 'OPORDs', link: '../opords' },
                { label: 'OPREPs', link: '../opreps' },
                { label: 'Activity', link: '../activity' }
            ];
        }
    }
}
