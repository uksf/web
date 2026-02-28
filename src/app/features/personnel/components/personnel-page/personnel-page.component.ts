import { Component, inject } from '@angular/core';
import { Permissions } from '@app/core/services/permissions';
import { PermissionsService } from '@app/core/services/permissions.service';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-personnel-page',
    templateUrl: './personnel-page.component.html',
    styleUrls: ['./personnel-page.component.scss'],
    imports: [MatTabNav, MatTabLink, RouterLinkActive, RouterLink, MatTabNavPanel, RouterOutlet]
})
export class PersonnelPageComponent {
    private permissions = inject(PermissionsService);

    tabLinks = [
        { label: 'LOAs', link: './loas' }
        // { label: 'Activity', link: './activity' }
    ];

    trackByLink(index: number, item: { link: string }): string {
        return item.link;
    }

    constructor() {
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
