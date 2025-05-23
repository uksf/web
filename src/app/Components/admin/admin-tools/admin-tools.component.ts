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
    debug: boolean = false;
    impersonationPending: boolean = false;
    model: { accountId: undefined } = {
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
            {
                key: 'deleteGithubIssueCommand',
                title: 'Delete Discord Github Issue Command',
                function: this.deleteGithubIssueCommand,
                pending: false
            },
            { key: 'reloadTeamspeak', title: 'Reload TeamSpeak', function: this.reloadTeamspeak, pending: false },
            { key: 'emergencyCleanup', title: 'Emergency Cleanup Stuck Builds', function: this.emergencyCleanupStuckBuilds, pending: false }
        ];
        this.debugTools = [{ key: 'notification', title: 'Test Notification', function: this.testNotification, pending: false }];

        this.debug = isDevMode();

        if (this.permissions.hasPermission(Permissions.SUPERADMIN)) {
            this.getAccounts();
        }
    }

    getAccounts(): void {
        this.httpClient.get(`${this.urlService.apiUrl}/accounts/active`).subscribe({
            next: (accounts: BasicAccount[]): void => {
                const elements: IDropdownElement[] = accounts.map(BasicAccount.mapToElement);
                this.accounts.next(elements);
                this.accounts.complete();
            }
        });
    }

    getAccountName(element: IDropdownElement): string {
        return mapFromElement(BasicAccount, element).displayName;
    }

    runFunction(tool): void {
        if (tool.pending) {
            return;
        }

        tool.pending = true;
        tool.function.call(this);
    }

    invalidateCaches(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'invalidate');
        this.httpClient.get(`${this.urlService.apiUrl}/data/invalidate`).subscribe(this.setPending(tool));
    }

    getDiscordRoles(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'getDiscord');
        this.httpClient.get(`${this.urlService.apiUrl}/discord/roles`, { responseType: 'text' }).subscribe({
            next: (response: string): void => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: response }
                });
                tool.pending = false;
            },
            error: (): void => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: 'Failed to get Discord roles' }
                });
                tool.pending = false;
            }
        });
    }

    updateDiscordRoles(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'updateDiscord');
        this.httpClient.get(`${this.urlService.apiUrl}/discord/updateuserroles`).subscribe(this.setPending(tool));
    }

    deleteGithubIssueCommand(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'deleteGithubIssueCommand');
        this.httpClient.delete(`${this.urlService.apiUrl}/discord/commands/newGithubIssue`).subscribe(this.setPending(tool));
    }

    reloadTeamspeak(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'reloadTeamspeak');
        this.httpClient.get(`${this.urlService.apiUrl}/teamspeak/reload`).subscribe(this.setPending(tool));
    }

    testNotification(): void {
        let tool: Tool = this.debugTools.find((x: Tool): boolean => x.key === 'notification');
        this.httpClient.get(`${this.urlService.apiUrl}/debug/notifications-test`).subscribe(this.setPending(tool));
    }

    emergencyCleanupStuckBuilds(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'emergencyCleanup');
        this.httpClient.post(`${this.urlService.apiUrl}/modpack/builds/emergency-cleanup`, {}).subscribe({
            next: (response: any): void => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: response.message }
                });
                tool.pending = false;
            },
            error: (): void => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: 'Failed to perform emergency cleanup' }
                });
                tool.pending = false;
            }
        });
    }

    impersonate(): void {
        this.impersonationPending = true;
        this.auth.impersonate(
            mapFromElement(BasicAccount, this.model.accountId).id,
            (): void => {
                this.impersonationPending = false;

                this.permissions.refresh().then((): void => {
                    this.router.navigate(['/home']).then();
                });
            },
            (error: string): void => {
                this.impersonationPending = false;
                this.dialog.open(MessageModalComponent, {
                    data: { message: error }
                });
            }
        );
    }

    private setPending(tool: Tool): { next: (_) => void; error: (_) => void } {
        return {
            next: (_): void => {
                tool.pending = false;
            },
            error: (_): void => {
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
