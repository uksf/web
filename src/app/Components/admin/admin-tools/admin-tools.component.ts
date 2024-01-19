import { Component, isDevMode, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { AccountService } from 'app/Services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../elements/dropdown-base/dropdown-base.component';
import { BasicAccount } from '../../../Models/Account';
import { PermissionsService } from '../../../Services/permissions.service';
import { Permissions } from '../../../Services/permissions';
import { AuthenticationService } from '../../../Services/Authentication/authentication.service';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-admin-tools',
    templateUrl: './admin-tools.component.html',
    styleUrls: ['../../../Pages/admin-page/admin-page.component.scss', './admin-tools.component.scss']
})
export class AdminToolsComponent {
    @ViewChild(NgForm) form!: NgForm;
    accountId;
    tools: Tool[] = [];
    debugTools: Tool[] = [];
    debug = false;
    impersonationPending = false;
    model = {
        accountId: undefined
    };
    accounts: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);

    constructor(
        private httpClient: HttpClient,
        private urlService: UrlService,
        private accountService: AccountService,
        private dialog: MatDialog,
        private permissions: PermissionsService,
        private auth: AuthenticationService,
        private router: Router
    ) {}

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

        if (this.permissions.hasPermission(Permissions.SUPERADMIN)) {
            this.getAccounts();
        }
    }

    getAccounts() {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/active`).subscribe({
            next: (accounts: BasicAccount[]) => {
                const elements = accounts.map(BasicAccount.mapToElement);
                this.accounts.next(elements);
                this.accounts.complete();
            }
        });
    }

    getAccountName(element: IDropdownElement): string {
        return mapFromElement(BasicAccount, element).displayName;
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
        this.httpClient.get(`${this.urlService.apiUrl}/data/invalidate`).subscribe(this.setPending(tool));
    }

    getDiscordRoles() {
        let tool = this.tools.find((x) => x.key === 'getDiscord');
        this.httpClient.get(`${this.urlService.apiUrl}/discord/roles`, { responseType: 'text' }).subscribe({
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
        this.httpClient.get(`${this.urlService.apiUrl}/discord/updateuserroles`).subscribe(this.setPending(tool));
    }

    reloadTeamspeak() {
        let tool = this.tools.find((x) => x.key === 'reloadTeamspeak');
        this.httpClient.get(`${this.urlService.apiUrl}/teamspeak/reload`).subscribe(this.setPending(tool));
    }

    testNotification() {
        let tool = this.debugTools.find((x) => x.key === 'notification');
        this.httpClient.get(`${this.urlService.apiUrl}/debug/notifications-test`).subscribe(this.setPending(tool));
    }

    impersonate() {
        this.impersonationPending = true;
        this.auth.impersonate(
            mapFromElement(BasicAccount, this.model.accountId).id,
            () => {
                this.impersonationPending = false;

                this.permissions.refresh().then(() => {
                    this.router.navigate(['/home']).then();
                });
            },
            (error) => {
                this.impersonationPending = false;
                this.dialog.open(MessageModalComponent, {
                    data: { message: error }
                });
            }
        );
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
