import { Component } from '@angular/core';
import { Permissions } from '@app/core/services/permissions';
import { PermissionsService } from '@app/core/services/permissions.service';

@Component({
    selector: 'app-personnel-page',
    templateUrl: './personnel-page.component.html',
    styleUrls: ['./personnel-page.component.scss']
})
export class PersonnelPageComponent {
    tabLinks = [
        { label: 'LOAs', link: './loas' }
        // { label: 'Activity', link: './activity' }
    ];

    constructor(private permissions: PermissionsService) {
        if (this.permissions.hasPermission(Permissions.DISCHARGES)) {
            this.tabLinks = [
                { label: 'Roster', link: './roster' },
                { label: 'LOAs', link: './loas' },
                // { label: 'Activity', link: './activity' },
                { label: 'Discharges', link: './discharges' }
            ];
        }
    }
}
