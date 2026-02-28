import { Component, inject } from '@angular/core';
import { Permissions } from '@app/core/services/permissions';
import { PermissionsService } from '@app/core/services/permissions.service';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-operations-page',
    templateUrl: './operations-page.component.html',
    styleUrls: ['./operations-page.component.scss'],
    imports: [MatTabNav, MatTabLink, RouterLinkActive, RouterLink, MatTabNavPanel, RouterOutlet]
})
export class OperationsPageComponent {
    private permissions = inject(PermissionsService);

    tabLinks: { label: string; link: string }[] = [{ label: 'AAR', link: './aar' }];

    trackByLink(index: number, item: { link: string }): string {
        return item.link;
    }

    constructor() {
        if (this.permissions.hasPermission(Permissions.SERVERS)) {
            this.tabLinks.unshift({ label: 'Servers', link: './servers' });
        }
    }
}
