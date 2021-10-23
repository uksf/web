import { Component, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { AccountService } from 'app/Services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-admin-tools',
    templateUrl: './admin-tools.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.scss', './admin-tools.component.scss']
})
export class AdminToolsComponent {
    accountId;
    tools: Tool[] = [];
    debugTools: Tool[] = [];
    debug = false;

    constructor(private httpClient: HttpClient, private urls: UrlService, private accountService: AccountService, private dialog: MatDialog) {}

    ngOnInit(): void {
        this.accountId = this.accountService.account.id;

        this.tools = [
            { key: 'invalidate', title: 'Invalidate Data Caches', function: this.invalidateCaches, pending: false },
            { key: 'getDiscord', title: 'Get Discord Roles', function: this.getDiscordRoles, pending: false },
            { key: 'updateDiscord', title: 'Update Discord Users', function: this.updateDiscordRoles, pending: false },
            { key: 'reloadTeamspeak', title: 'Reload TeamSpeak', function: this.reloadTeamspeak, pending: false }
        ];

        this.debugTools = [{ key: 'notification', title: 'Test Notification', function: this.testNotification, pending: false }];

        this.debug = isDevMode();
    }

    runFunction(tool) {
        if (tool.pending) {
            return;
        }

        tool.pending = true;
        tool.function.call(this);
    }

    invalidateCaches() {
        let tool = this.tools.find((x) => x.key === 'invalidate');
        this.httpClient.get(`${this.urls.apiUrl}/data/invalidate`).subscribe(this.setPending(tool));
    }

    getDiscordRoles() {
        let tool = this.tools.find((x) => x.key === 'getDiscord');
        this.httpClient.get(`${this.urls.apiUrl}/discord/roles`, { responseType: 'text' }).subscribe({
            next: (response) => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: response }
                });
                tool.pending = false;
            },
            error: () => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: 'Failed to get Discord roles' }
                });
                tool.pending = false;
            }
        });
    }

    updateDiscordRoles() {
        let tool = this.tools.find((x) => x.key === 'updateDiscord');
        this.httpClient.get(`${this.urls.apiUrl}/discord/updateuserroles`).subscribe(this.setPending(tool));
    }

    reloadTeamspeak() {
        let tool = this.tools.find((x) => x.key === 'reloadTeamspeak');
        this.httpClient.get(`${this.urls.apiUrl}/teamspeak/reload`).subscribe(this.setPending(tool));
    }

    testNotification() {
        let tool = this.debugTools.find((x) => x.key === 'notification');
        this.httpClient.get(`${this.urls.apiUrl}/debug/notifications-test`).subscribe(this.setPending(tool));
    }

    private setPending(tool: Tool) {
        return {
            next: (_) => {
                tool.pending = false;
            },
            error: (_) => {
                tool.pending = false;
            }
        };
    }
}

interface Tool {
    key: string;
    title: string;
    function: () => void;
    pending: boolean;
}
