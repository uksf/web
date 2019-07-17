import { Component } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { Permissions } from 'app/Services/permissions';

@Component({
    selector: 'app-personnel-page',
    templateUrl: './personnel-page.component.html',
    styleUrls: ['./personnel-page.component.scss']
})
export class PersonnelPageComponent {
    tabLinks = [
        { label: 'LOAs', link: '../loas' },
        { label: 'Activity', link: '../activity' }
    ];

    constructor(private permissions: NgxPermissionsService) {
        const grantedPermissions = this.permissions.getPermissions();
        if (grantedPermissions[Permissions.DISCHARGES]) {
            this.tabLinks = [
                { label: 'LOAs', link: '../loas' },
                { label: 'Activity', link: '../activity' },
                { label: 'Discharges', link: '../discharges' }
            ];
        }
    }
}
