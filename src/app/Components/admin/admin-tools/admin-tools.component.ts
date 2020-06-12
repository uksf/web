import { Component, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { AccountService } from 'app/Services/account.service';
import { MatDialog } from '@angular/material';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-admin-tools',
    templateUrl: './admin-tools.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.css', './admin-tools.component.scss']
})
export class AdminToolsComponent {
    updating;
    accountId;
    tools = [];
    debugTools = [];
    debug = false;

    constructor(private httpClient: HttpClient, private urls: UrlService, private accountService: AccountService, private dialog: MatDialog) { }

    ngOnInit(): void {
        this.accountId = this.accountService.account.id;

        this.tools = [
            { title: 'Invalidate Data Caches', function: this.invalidateCaches },
            { title: 'Get Discord Roles', function: this.getDiscordRoles },
            { title: 'Update Discord Users', function: this.updateDiscordRoles }
        ];

        this.debugTools = [
            { title: 'Test Notification', function: this.testNotification }
        ];

        this.debug = isDevMode();
    }

    runFunction(tool) {
        tool.function.call(this);
    }

    invalidateCaches() {
        this.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/data/invalidate`).subscribe(_ => {
            this.updating = false;
        }, _ => {
            this.updating = false;
        });
    }

    getDiscordRoles() {
        this.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/discord/roles`, { responseType: 'text' }).subscribe(response => {
            this.dialog.open(MessageModalComponent, {
                data: { message: response }
            });
            this.updating = false;
        }, error => {
            this.dialog.open(MessageModalComponent, {
                data: { message: 'Failed to get Discord roles' }
            });
            this.updating = false;
        });
    }

    updateDiscordRoles() {
        this.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/discord/updateuserroles`).subscribe(_ => {
            this.updating = false;
        }, _ => {
            this.updating = false;
        });
    }

    testNotification() {
        this.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/debug/notifications-test`).subscribe(_ => {
            this.updating = false;
        }, _ => {
            this.updating = false;
        });
    }
}
