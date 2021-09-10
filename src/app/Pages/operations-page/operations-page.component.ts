import { Component } from '@angular/core';
import { Permissions } from 'app/Services/permissions';
import { PermissionsService } from 'app/Services/permissions.service';

@Component({
    selector: 'app-operations-page',
    templateUrl: './operations-page.component.html',
    styleUrls: ['./operations-page.component.scss']
})
export class OperationsPageComponent {
    tabLinks = [
        // { label: 'OPORDs', link: '../opords' },
        // { label: 'OPREPs', link: '../opreps' },
        // { label: 'Activity', link: '../activity' }
    ];

    constructor(private permissions: PermissionsService) {
        if (this.permissions.hasPermission(Permissions.SERVERS)) {
            this.tabLinks = [
                { label: 'Servers', link: '../servers' }
                // { label: 'OPORDs', link: '../opords' },
                // { label: 'OPREPs', link: '../opreps' },
                // { label: 'Activity', link: '../activity' }
            ];
        }
    }
}
