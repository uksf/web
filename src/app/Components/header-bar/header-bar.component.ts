import { Component, OnInit, HostListener, EventEmitter } from '@angular/core';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';
import { AccountService } from '../../Services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { RequestLoaModalComponent } from '../../Modals/command/request-loa-modal/request-loa-modal.component';
import { PermissionsService } from '../../Services/permissions.service';

@Component({
    selector: 'app-header-bar',
    templateUrl: './header-bar.component.html',
    styleUrls: ['./header-bar.component.scss'],
})
export class HeaderBarComponent implements OnInit {
    static otherTheme;
    static themeUpdateEvent: EventEmitter<null>;
    mobile = false;
    mobileSmall = false;

    constructor(private permissionsService: PermissionsService, private accountService: AccountService, private dialog: MatDialog) {}

    ngOnInit() {
        this.mobile = window.screen.width <= 768 && window.screen.width > 375;
        this.mobileSmall = window.screen.width <= 375;
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.mobile = window.screen.width <= 768 && window.screen.width > 375;
        this.mobileSmall = window.screen.width <= 375;
    }

    get getName() {
        try {
            return this.accountService.account.displayName;
        } catch (err) {
            return undefined;
        }
    }

    openLOAModal() {
        this.dialog.open(RequestLoaModalComponent, {});
    }

    get otherTheme() {
        return HeaderBarComponent.otherTheme;
    }

    toggleTheme() {
        HeaderBarComponent.themeUpdateEvent.emit();
    }

    logout() {
        this.permissionsService.revoke();
    }
}
