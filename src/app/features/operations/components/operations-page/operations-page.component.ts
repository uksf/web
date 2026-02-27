import { Component } from '@angular/core';
import { Permissions } from '@app/core/services/permissions';
import { PermissionsService } from '@app/core/services/permissions.service';

@Component({
    selector: 'app-operations-page',
    templateUrl: './operations-page.component.html',
    styleUrls: ['./operations-page.component.scss'],
    standalone: false
})
export class OperationsPageComponent {
    tabLinks: { label: string; link: string }[] = [{ label: 'AAR', link: './aar' }];

    trackByLink(index: number, item: { link: string }): string {
        return item.link;
    }

    constructor(private permissions: PermissionsService) {
        if (this.permissions.hasPermission(Permissions.SERVERS)) {
            this.tabLinks.unshift({ label: 'Servers', link: './servers' });
        }
    }
}
