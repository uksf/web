import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';

interface TabLink {
    label: string;
    link: string;
}

const AAR: TabLink = { label: 'AAR', link: 'aar' };
const CAMPAIGNS: TabLink = { label: 'Campaigns', link: 'campaigns' };
const MISSIONS: TabLink = { label: 'Missions', link: 'missions' };
const SERVERS: TabLink = { label: 'Servers', link: 'servers' };

@Component({
    selector: 'app-operations-page',
    templateUrl: './operations-page.component.html',
    styleUrls: ['./operations-page.component.scss'],
    imports: [MatTabNav, MatTabLink, RouterLinkActive, RouterLink, MatTabNavPanel, RouterOutlet]
})
export class OperationsPageComponent {
    private ngxPermissions = inject(NgxPermissionsService);
    private permissions = toSignal(this.ngxPermissions.permissions$, { requireSync: true });

    tabLinks = computed<TabLink[]>(() => (this.permissions()['SERVERS'] ? [CAMPAIGNS, AAR, MISSIONS, SERVERS] : [CAMPAIGNS, AAR]));
}
