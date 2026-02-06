import { Component } from '@angular/core';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Permissions } from '@app/core/services/permissions';

@Component({
    selector: 'app-modpack-page',
    templateUrl: './modpack-page.component.html',
    styleUrls: ['./modpack-page.component.scss', './modpack-page.component.scss-theme.scss']
})
export class ModpackPageComponent {
    tabLinks = [{ label: 'Guide', link: '../guide' }];

    trackByLink(index: number, item: any): string {
        return item.link;
    }

    constructor(private permissions: PermissionsService) {
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
