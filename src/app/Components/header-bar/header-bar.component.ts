import { Component, OnInit, HostListener } from '@angular/core';
import { AccountService } from '../../Services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { RequestLoaModalComponent } from '@app/Modals/request-loa-modal/request-loa-modal.component';
import { PermissionsService } from '../../Services/permissions.service';
import { AppSettingsService, Environments } from '../../Services/appSettingsService.service';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';

@Component({
    selector: 'app-header-bar',
    templateUrl: './header-bar.component.html',
    styleUrls: ['./header-bar.component.scss']
})
export class HeaderBarComponent implements OnInit {
    environments = Environments;
    mobile = false;
    mobileSmall = false;
    currentEnvironment: string;

    constructor(
        private permissionsService: PermissionsService,
        private accountService: AccountService,
        private dialog: MatDialog,
        appSettings: AppSettingsService,
        private auth: AuthenticationService
    ) {
        this.currentEnvironment = appSettings.appSetting('environment');
    }

    ngOnInit() {
        this.mobile = window.screen.width <= 768 && window.screen.width > 375;
        this.mobileSmall = window.screen.width <= 375;
    }

    @HostListener('window:resize')
    onResize() {
        this.mobile = window.screen.width <= 768 && window.screen.width > 375;
        this.mobileSmall = window.screen.width <= 375;
    }

    openLOAModal() {
        this.dialog.open(RequestLoaModalComponent, {});
    }

    logout() {
        this.permissionsService.revoke();
    }

    get getName() {
        try {
            return this.accountService.account.displayName;
        } catch (err) {
            return undefined;
        }
    }

    get profileColor() {
        return this.auth.isImpersonated() ? 'impersonated' : this.currentEnvironment === Environments.Development ? 'warn' : 'primary';
    }
}
