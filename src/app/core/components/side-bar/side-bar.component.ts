import { Component, OnInit } from '@angular/core';
import { first, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Permissions } from '@app/core/services/permissions';
import { AccountService } from '@app/core/services/account.service';
import { AppComponent } from '@app/app.component';
import { VersionService } from '@app/core/services/version.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { ApplicationState } from '@app/features/application/models/application';
import { DestroyableComponent } from '@app/shared/components';

@Component({
    selector: 'app-side-bar',
    templateUrl: './side-bar.component.html',
    styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent extends DestroyableComponent implements OnInit {
    newVersion = false;
    version = 0;
    private onReceiveFrontendUpdate = (version) => {
        if (parseInt(version, 10) > this.version) {
            this.newVersion = true;
        }
    };
    private guestMenu = [
        { text: 'Home', link: 'home', icon: 'home' },
        // { text: 'Docs', link: 'admin', icon: 'book' },
        // { text: 'Policy', link: 'policy', icon: 'gavel' },
        { text: 'Units', link: 'units', icon: 'memory' },
        { text: 'Application', link: 'application', icon: 'contact_mail' }
    ];
    private memberMenuStart = [
        { text: 'Home', link: 'home', icon: 'home' },
        { text: 'Units', link: 'units', icon: 'memory' },
        { text: 'Operations', link: 'operations', icon: 'public' },
        { text: 'Personnel', link: 'personnel', icon: 'group' }
        // { text: "Training", link: 'admin', icon: "explore" } disabled until implemented
    ];
    private memberMenuEnd = [
        { text: 'Modpack', link: 'modpack', icon: 'build' },
        { text: 'Information', link: 'information', icon: 'layers' }
        // { text: "Statistics", link: 'admin', icon: "equalizer" }, disabled until implemented
    ];
    private notLoggedMenu = [
        { text: 'Home', link: 'home', icon: 'home' },
        // { text: 'Docs', link: 'admin', icon: 'book' },
        // { text: 'Policy', link: 'policy', icon: 'gavel' },
        { text: 'About', link: 'information/about', icon: 'layers' },
        { text: 'Application', link: 'application', icon: 'contact_mail' }
    ];
    private currentPermissions;
    private currentAccount;
    private cachedSideBarElements;

    constructor(private router: Router, private permissions: PermissionsService, private accountService: AccountService, private versionService: VersionService) {
        super();
    }

    ngOnInit() {
        this.checkVersion();
        AppComponent.utilityHubConnection.connection.on('ReceiveFrontendUpdate', this.onReceiveFrontendUpdate);
        AppComponent.utilityHubConnection.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.checkVersion();
            }
        });
    }

    override ngOnDestroy() {
        super.ngOnDestroy();
        AppComponent.utilityHubConnection.connection.off('ReceiveFrontendUpdate', this.onReceiveFrontendUpdate);
    }

    get currentRouterItem() {
        return this.router.url.split('/')[1];
    }

    isSelected(navigationItem) {
        return this.currentRouterItem === navigationItem.link || this.router.url.slice(1) === navigationItem.link;
    }

    get getSideBarElements() {
        const grantedPermissions = this.permissions.getPermissions();
        if (this.cachedSideBarElements !== null && this.currentPermissions === grantedPermissions && this.accountService.account === this.currentAccount) {
            return this.cachedSideBarElements;
        }

        this.currentPermissions = grantedPermissions;
        this.currentAccount = this.accountService.account;
        if (grantedPermissions[Permissions.UNLOGGED]) {
            this.cachedSideBarElements = this.notLoggedMenu;
        } else if (grantedPermissions[Permissions.CONFIRMED] || grantedPermissions[Permissions.UNCONFIRMED]) {
            let combinedArray = [];
            combinedArray = combinedArray.concat(this.guestMenu);
            if (this.accountService.account.application && this.accountService.account.application.state === ApplicationState.WAITING) {
                combinedArray.push({ text: 'Modpack', link: 'modpack/guide', icon: 'terrain' });
            }
            this.cachedSideBarElements = combinedArray;
        } else if (grantedPermissions[Permissions.MEMBER]) {
            let combinedArray = [];
            combinedArray = combinedArray.concat(this.memberMenuStart);
            if (grantedPermissions[Permissions.RECRUITER]) {
                combinedArray.push({ text: 'Recruitment', link: 'recruitment', icon: 'group_add' });
            }
            if (grantedPermissions[Permissions.COMMAND]) {
                combinedArray.push({ text: 'Command', link: 'command', icon: 'device_hub' });
            }
            if (grantedPermissions[Permissions.ADMIN]) {
                combinedArray.push({ text: 'Admin', link: 'admin', icon: 'settings' });
            }
            combinedArray = combinedArray.concat(this.memberMenuEnd);
            this.cachedSideBarElements = combinedArray;
        }
        return this.cachedSideBarElements;
    }

    checkVersion() {
        this.versionService.getVersion().pipe(first()).subscribe({
            next: (version) => {
                if (this.version !== 0 && version > this.version) {
                    this.newVersion = true;
                }
                this.version = version;
            }
        });
    }

    trackByLink(index: number, item: { link: string }): string {
        return item.link;
    }

    updateVersion() {
        window.location.reload();
    }
}
