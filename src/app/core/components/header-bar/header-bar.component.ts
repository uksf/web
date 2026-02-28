import { Component, OnInit, HostListener } from '@angular/core';
import { AccountService } from '@app/core/services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { RequestLoaModalComponent } from '@app/shared/modals/request-loa-modal/request-loa-modal.component';
import { PermissionsService } from '@app/core/services/permissions.service';
import { AppSettingsService, Environments } from '@app/core/services/app-settings.service';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { RouterLink } from '@angular/router';
import { FlexFillerComponent } from '../../../shared/components/elements/flex-filler/flex-filler.component';
import { NgxPermissionsModule } from 'ngx-permissions';
import { NotificationsComponent } from '../notifications/notifications.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { CoreModule } from '../../core.module';

@Component({
    selector: 'app-header-bar',
    templateUrl: './header-bar.component.html',
    styleUrls: ['./header-bar.component.scss'],
    imports: [RouterLink, FlexFillerComponent, NgxPermissionsModule, NotificationsComponent, MatButton, MatIcon, MatMenuTrigger, MatMenu, MatMenuItem, CoreModule]
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
