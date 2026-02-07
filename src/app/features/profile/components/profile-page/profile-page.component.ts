import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AccountService } from '@app/core/services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { ConnectTeamspeakModalComponent } from '../../modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { ChangePasswordModalComponent } from '../../modals/change-password-modal/change-password-modal.component';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ChangeFirstLastModalComponent } from '../../modals/change-first-last-modal/change-first-last-modal.component';
import { Permissions } from '@app/core/services/permissions';
import { CountryPickerService, ICountry } from '@app/shared/services/country-picker/country-picker.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Account, MembershipState } from '@app/shared/models/account';

@Component({
    selector: 'app-profile-page',
    templateUrl: './profile-page.component.html',
    styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit, OnDestroy {
    countries: ICountry[];
    membershipState = MembershipState;
    account;
    accountId: string;
    settingsFormGroup: UntypedFormGroup;
    accountSubscription: Subscription;
    isNco: boolean;
    isAdmin: boolean;
    isRecruiter: boolean;

    private destroy$ = new Subject<void>();
    private settingsTimeoutId: ReturnType<typeof setTimeout> | null = null;

    constructor(
        public dialog: MatDialog,
        private accountService: AccountService,
        private route: ActivatedRoute,
        private httpClient: HttpClient,
        private urls: UrlService,
        private router: Router,
        private formbuilder: UntypedFormBuilder,
        private permissions: PermissionsService
    ) {
        this.settingsFormGroup = this.formbuilder.group({
            notificationsEmail: [''],
            notificationsTeamspeak: [''],
            sr1Enabled: ['']
        });

        this.countries = CountryPickerService.countries;

        this.isNco = this.permissions.hasPermission(Permissions.NCO);
        this.isAdmin = this.permissions.hasPermission(Permissions.ADMIN);
        this.isRecruiter = this.permissions.hasPermission(Permissions.RECRUITER);
    }

    ngOnInit() {
        if (this.route.snapshot.queryParams['steamid']) {
            const id = this.route.snapshot.queryParams['steamid'];
            if (id === 'fail') {
                this.router.navigate(['/profile']).then(() => {
                    this.getAccount();
                    this.dialog
                        .open(MessageModalComponent, {
                            data: { message: 'Steam failed to connect' }
                        })
                        .afterClosed()
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.accountService.checkConnections();
                            }
                        });
                });
            } else {
                const code = this.route.snapshot.queryParams['validation'];
                this.httpClient.post(this.urls.apiUrl + '/steamcode/' + id, { code: code }).pipe(takeUntil(this.destroy$)).subscribe({
                    next: () => {
                        this.router.navigate(['/profile']).then(() => {
                            this.getAccount();
                            this.dialog
                                .open(MessageModalComponent, {
                                    data: { message: 'Steam successfully connected' }
                                })
                                .afterClosed()
                                .pipe(takeUntil(this.destroy$))
                                .subscribe({
                                    next: () => {
                                        this.accountService.checkConnections();
                                    }
                                });
                        });
                    },
                    error: (error) => {
                        this.router.navigate(['/profile']).then(() => {
                            this.getAccount();
                            this.dialog
                                .open(MessageModalComponent, {
                                    data: { message: error.error }
                                })
                                .afterClosed()
                                .pipe(takeUntil(this.destroy$))
                                .subscribe({
                                    next: () => {
                                        this.accountService.checkConnections();
                                    }
                                });
                        });
                    }
                });
            }
        } else if (this.route.snapshot.queryParams['discordid']) {
            const id = this.route.snapshot.queryParams['discordid'];
            if (id === 'fail') {
                this.router.navigate(['/profile']).then(() => {
                    this.getAccount();
                    this.dialog
                        .open(MessageModalComponent, {
                            data: { message: 'Discord failed to connect' }
                        })
                        .afterClosed()
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: () => {
                                this.accountService.checkConnections();
                            }
                        });
                });
            } else {
                const code = this.route.snapshot.queryParams['validation'];
                const added = this.route.snapshot.queryParams['added'];
                this.httpClient.post(this.urls.apiUrl + '/discordcode/' + id, { code: code }).pipe(takeUntil(this.destroy$)).subscribe({
                    next: () => {
                        this.router.navigate(['/profile']).then(() => {
                            this.getAccount();
                            if (added === 'true') {
                                this.dialog
                                    .open(MessageModalComponent, {
                                        data: { message: 'Discord successfully connected' }
                                    })
                                    .afterClosed()
                                    .pipe(takeUntil(this.destroy$))
                                    .subscribe({
                                        next: () => {
                                            this.accountService.checkConnections();
                                        }
                                    });
                            } else {
                                this.dialog
                                    .open(ConfirmationModalComponent, {
                                        data: {
                                            message: "Discord successfully connected\n\nWe were unable to add you to our Discord server.\nPlease join by pressing 'Join Discord'",
                                            button: 'Join Discord'
                                        }
                                    })
                                    .afterClosed()
                                    .pipe(takeUntil(this.destroy$))
                                    .subscribe({
                                        next: (result) => {
                                            this.accountService.checkConnections();
                                            if (result) {
                                                window.open('https://discord.uk-sf.co.uk', '_blank');
                                            }
                                        }
                                    });
                            }
                        });
                    },
                    error: (error) => {
                        this.router.navigate(['/profile']).then(() => {
                            this.getAccount();
                            this.dialog
                                .open(MessageModalComponent, {
                                    data: { message: error.error }
                                })
                                .afterClosed()
                                .pipe(takeUntil(this.destroy$))
                                .subscribe({
                                    next: () => {
                                        this.accountService.checkConnections();
                                    }
                                });
                        });
                    }
                });
            }
        } else {
            this.getAccount();
        }
    }

    getAccount(forceRefresh: boolean = false) {
        if (this.route.snapshot.params.id) {
            this.accountId = this.route.snapshot.params.id;
            this.httpClient.get(this.urls.apiUrl + '/accounts/' + this.accountId).pipe(takeUntil(this.destroy$)).subscribe({
                next: (response) => {
                    this.account = response;
                    this.populateSettings();
                }
            });
        } else {
            if (forceRefresh) {
                this.accountService.getAccount()?.pipe(takeUntil(this.destroy$)).subscribe({
                    next: (account) => {
                        this.setAccount(account);
                    }
                });
            } else {
                this.setAccount(this.accountService.account);
            }
        }
    }

    private setAccount(account: Account) {
        this.account = account;
        this.populateSettings();

        if (this.accountSubscription) {
            this.accountSubscription.unsubscribe();
        }

        this.accountSubscription = this.accountService.accountChange$.subscribe({
            next: (newAccount) => {
                this.account = newAccount;
                this.populateSettings();
            }
        });
    }

    get loaded(): boolean {
        return this.account !== null && this.account !== undefined;
    }

    get isMyProfile() {
        return !this.accountId;
    }

    openChangeNameModal() {
        this.dialog
            .open(ChangeFirstLastModalComponent, {})
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.getAccount(true);
                }
            });
    }

    openChangePasswordModal() {
        this.dialog.open(ChangePasswordModalComponent, {});
    }

    openTeamspeakModal() {
        this.dialog
            .open(ConnectTeamspeakModalComponent, { disableClose: true })
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.getAccount(true);
                }
            });
    }

    connectSteam() {
        this.dialog
            .open(ConfirmationModalComponent, {
                data: {
                    message:
                        "By pressing 'Continue' you will be redirected to <b>steamcommunity.com</b> where you will be asked to log in." +
                        '\nBy doing so, we are able to read only your Steam User ID, which we store in our database for the purpose of verifying you have a valid Steam account and for recruitment communication.' +
                        '\nWe can read no more information about your account than this.' +
                        '\n\nPlease note this is done on the official Steam website, meaning we have zero interaction with your login process.' +
                        '\nIf you have any concerns about this process, please contact UKSF Staff for assistance.',
                    button: 'Continue'
                }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    if (result) {
                        window.location.href = this.urls.apiUrl + '/steamconnection';
                    }
                }
            });
    }

    connectDiscord() {
        this.dialog
            .open(ConfirmationModalComponent, {
                data: {
                    message:
                        "By pressing 'Continue' you will be redirected to <b>discord.com</b> where you will be asked to log in." +
                        '\nBy doing so, we are able to read only your Discord User ID, which we store in our database for the purpose of connectivity between this website and our Discord server.' +
                        '\nWe can read no more information about your account than this.' +
                        '\n\nPlease note this is done on the official Discord website, meaning we have zero interaction with your login process.' +
                        '\nIf you have any concerns about this process, please contact UKSF Staff for assistance.',
                    button: 'Continue'
                }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    if (result) {
                        window.location.href = this.urls.apiUrl + '/discordconnection';
                    }
                }
            });
    }

    private populateSettings() {
        if (this.account === null || this.account === undefined) {
            this.settingsTimeoutId = setTimeout(() => {
                this.populateSettings();
            }, 100);
            return;
        }
        this.settingsFormGroup.controls['notificationsEmail'].setValue(this.account.settings['notificationsEmail']);
        this.settingsFormGroup.controls['notificationsTeamspeak'].setValue(this.account.settings['notificationsTeamspeak']);
        this.settingsFormGroup.controls['sr1Enabled'].setValue(this.account.settings['sr1Enabled']);
    }

    changeSetting() {
        this.settingsFormGroup.disable();
        this.httpClient.put(`${this.urls.apiUrl}/accounts/${this.account.id}/updatesetting`, this.settingsFormGroup.value).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getAccount(true);
                this.settingsFormGroup.enable();
            }
        });
    }

    trackByIndex(index: number): number {
        return index;
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();

        if (this.accountSubscription) {
            this.accountSubscription.unsubscribe();
        }

        if (this.settingsTimeoutId !== null) {
            clearTimeout(this.settingsTimeoutId);
        }
    }
}
