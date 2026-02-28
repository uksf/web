import { Component, inject } from '@angular/core';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Permissions } from '@app/core/services/permissions';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-modpack-page',
    templateUrl: './modpack-page.component.html',
    styleUrls: ['./modpack-page.component.scss', './modpack-page.component.scss-theme.scss'],
    imports: [MatTabNav, MatTabLink, RouterLinkActive, RouterLink, MatTabNavPanel, RouterOutlet]
})
export class ModpackPageComponent {
    private permissions = inject(PermissionsService);

    tabLinks = [{ label: 'Guide', link: '../guide' }];

    trackByLink(index: number, item: { link: string }): string {
        return item.link;
    }

    constructor() {
        if (this.permissions.hasPermission(Permissions.MEMBER)) {
            this.tabLinks = [
                { label: 'Guide', link: '../guide' },
                { label: 'Releases', link: '../releases' },
                { label: 'Dev Builds', link: '../builds-dev' },
                { label: 'RC Builds', link: '../builds-rc' },
                { label: 'Workshop', link: '../workshop' }
            ];
        }
    }
}
