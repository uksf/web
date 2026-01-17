import { Component } from '@angular/core';
import { Permissions } from '../../Services/permissions';
import { PermissionsService } from '../../Services/permissions.service';

@Component({
    selector: 'app-operations-page',
    templateUrl: './operations-page.component.html',
    styleUrls: ['./operations-page.component.scss']
})
export class OperationsPageComponent {
    tabLinks: { label: string; link: string }[] = [{ label: 'AAR', link: '../aar' }];

    constructor(private permissions: PermissionsService) {
        if (this.permissions.hasPermission(Permissions.SERVERS)) {
            this.tabLinks.unshift({ label: 'Servers', link: '../servers' });
        }
    }
}
