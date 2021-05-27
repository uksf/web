import { Component, OnInit, HostListener, EventEmitter } from '@angular/core';
import { AccountService } from '../../Services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { RequestLoaModalComponent } from '../../Modals/command/request-loa-modal/request-loa-modal.component';
import { PermissionsService } from '../../Services/permissions.service';
import { AppSettingsService, Environments } from '../../Services/appSettingsService.service';

@Component({
    selector: 'app-header-bar',
    templateUrl: './header-bar.component.html',
    styleUrls: ['./header-bar.component.scss'],
})
export class HeaderBarComponent implements OnInit {
    static otherTheme;
    static themeUpdateEvent: EventEmitter<null>;
    environments = Environments;
    mobile = false;
    mobileSmall = false;
    currentEnvironment: string;

    constructor(private permissionsService: PermissionsService, private accountService: AccountService, private dialog: MatDialog, appSettings: AppSettingsService) {
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

    toggleTheme() {
        HeaderBarComponent.themeUpdateEvent.emit();
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
        return this.currentEnvironment === Environments.Development ? 'warn' : 'primary';
    }

    get otherTheme() {
        return HeaderBarComponent.otherTheme;
    }
}
