import { Component, isDevMode, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AccountService } from '@app/core/services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IDropdownElement, mapFromElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { BasicAccount } from '@app/shared/models/account';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Permissions } from '@app/core/services/permissions';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UksfError } from '@app/shared/models/response';
import { AdminToolsService } from '../../services/admin-tools.service';

@Component({
    selector: 'app-admin-tools',
    templateUrl: './admin-tools.component.html',
    styleUrls: ['../admin-page/admin-page.component.scss', './admin-tools.component.scss']
})
export class AdminToolsComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
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
        private adminToolsService: AdminToolsService,
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

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getAccounts(): void {
        this.adminToolsService.getActiveAccounts().pipe(takeUntil(this.destroy$)).subscribe({
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

    runFunction(tool: Tool): void {
        if (tool.pending) {
            return;
        }

        tool.pending = true;
        tool.function.call(this);
    }

    invalidateCaches(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'invalidate');
        this.adminToolsService.invalidateCaches().pipe(takeUntil(this.destroy$)).subscribe(this.setPending(tool));
    }

    getDiscordRoles(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'getDiscord');
        this.adminToolsService.getDiscordRoles().pipe(takeUntil(this.destroy$)).subscribe({
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
        this.adminToolsService.updateDiscordRoles().pipe(takeUntil(this.destroy$)).subscribe(this.setPending(tool));
    }

    deleteGithubIssueCommand(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'deleteGithubIssueCommand');
        this.adminToolsService.deleteGithubIssueCommand().pipe(takeUntil(this.destroy$)).subscribe(this.setPending(tool));
    }

    reloadTeamspeak(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'reloadTeamspeak');
        this.adminToolsService.reloadTeamspeak().pipe(takeUntil(this.destroy$)).subscribe(this.setPending(tool));
    }

    testNotification(): void {
        let tool: Tool = this.debugTools.find((x: Tool): boolean => x.key === 'notification');
        this.adminToolsService.testNotification().pipe(takeUntil(this.destroy$)).subscribe(this.setPending(tool));
    }

    emergencyCleanupStuckBuilds(): void {
        let tool: Tool = this.tools.find((x: Tool): boolean => x.key === 'emergencyCleanup');
        this.adminToolsService.emergencyCleanupStuckBuilds().pipe(takeUntil(this.destroy$)).subscribe({
            next: (response: { message: string }): void => {
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
        this.auth.impersonate(mapFromElement(BasicAccount, this.model.accountId).id).pipe(takeUntil(this.destroy$)).subscribe({
            next: (): void => {
                this.impersonationPending = false;
                this.permissions.refresh().then((): void => {
                    this.router.navigate(['/home']).then();
                });
            },
            error: (error: UksfError): void => {
                this.impersonationPending = false;
                this.dialog.open(MessageModalComponent, {
                    data: { message: error?.error || 'Impersonation failed' }
                });
            }
        });
    }

    private setPending(tool: Tool): { next: (_: unknown) => void; error: (_: unknown) => void } {
        return {
            next: (_: unknown): void => {
                tool.pending = false;
            },
            error: (_: unknown): void => {
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
