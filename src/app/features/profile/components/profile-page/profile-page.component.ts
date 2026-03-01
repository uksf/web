import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AccountService } from '@app/core/services/account.service';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { ProfileService } from '../../services/profile.service';
import { MembersService } from '@app/shared/services/members.service';
import { ConnectTeamspeakModalComponent } from '../../modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { ChangePasswordModalComponent } from '../../modals/change-password-modal/change-password-modal.component';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChangeFirstLastModalComponent } from '../../modals/change-first-last-modal/change-first-last-modal.component';
import { Permissions } from '@app/core/services/permissions';
import { CountryPickerService, ICountry } from '@app/shared/services/country-picker/country-picker.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { first, takeUntil } from 'rxjs/operators';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Account, MembershipState } from '@app/shared/models/account';
import { DestroyableComponent } from '@app/shared/components';
import { DefaultContentAreasComponent } from '../../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '../../../../shared/components/content-areas/full-content-area/full-content-area.component';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatButton } from '@angular/material/button';
import { MainContentAreaComponent } from '../../../../shared/components/content-areas/main-content-area/main-content-area.component';
import { MatCard } from '@angular/material/card';
import { SideContentAreaComponent } from '../../../../shared/components/content-areas/side-content-area/side-content-area.component';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxPermissionsModule } from 'ngx-permissions';
import { DatePipe } from '@angular/common';
import { CountryImage } from '../../../../shared/pipes/country.pipe';
import { ReactiveFormValueDebugComponent } from '../../../../shared/components/elements/form-value-debug/form-value-debug.component';

@Component({
    selector: 'app-profile-page',
    templateUrl: './profile-page.component.html',
    styleUrls: ['./profile-page.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        FullContentAreaComponent,
        FlexFillerComponent,
        MatButton,
        MainContentAreaComponent,
        MatCard,
        RouterLink,
        SideContentAreaComponent,
        FormsModule,
        ReactiveFormsModule,
        MatCheckbox,
        MatTooltip,
        NgxPermissionsModule,
        DatePipe,
        CountryImage,
        ReactiveFormValueDebugComponent
    ]
})
export class ProfilePageComponent extends DestroyableComponent implements OnInit {
    dialog = inject(MatDialog);
    private accountService = inject(AccountService);
    private route = inject(ActivatedRoute);
    private profileService = inject(ProfileService);
    private membersService = inject(MembersService);
    private urls = inject(UrlService);
    private router = inject(Router);
    private formBuilder = inject(FormBuilder);
    private permissions = inject(PermissionsService);

    countries: ICountry[];
    membershipState = MembershipState;
    account;
    accountId: string;
    settingsFormGroup = this.formBuilder.group({
        notificationsEmail: [''],
        notificationsTeamspeak: [''],
        sr1Enabled: ['']
    });
    isNco: boolean;
    isAdmin: boolean;
    isRecruiter: boolean;

    private settingsTimeoutId: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        super();
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
                        .pipe(first())
                        .subscribe({
                            next: () => {
                                this.accountService.checkConnections();
                            }
                        });
                });
            } else {
                const code = this.route.snapshot.queryParams['validation'];
                this.profileService
                    .connectSteam(id, { code: code })
                    .pipe(first())
                    .subscribe({
                        next: () => {
                            this.router.navigate(['/profile']).then(() => {
                                this.getAccount();
                                this.dialog
                                    .open(MessageModalComponent, {
                                        data: { message: 'Steam successfully connected' }
                                    })
                                    .afterClosed()
                                    .pipe(first())
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
                                    .pipe(first())
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
                        .pipe(first())
                        .subscribe({
                            next: () => {
                                this.accountService.checkConnections();
                            }
                        });
                });
            } else {
                const code = this.route.snapshot.queryParams['validation'];
                const added = this.route.snapshot.queryParams['added'];
                this.profileService
                    .connectDiscord(id, { code: code })
                    .pipe(first())
                    .subscribe({
                        next: () => {
                            this.router.navigate(['/profile']).then(() => {
                                this.getAccount();
                                if (added === 'true') {
                                    this.dialog
                                        .open(MessageModalComponent, {
                                            data: { message: 'Discord successfully connected' }
                                        })
                                        .afterClosed()
                                        .pipe(first())
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
                                        .pipe(first())
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
                                    .pipe(first())
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
            this.membersService
                .getAccount(this.accountId)
                .pipe(first())
                .subscribe({
                    next: (response) => {
                        this.account = response;
                        this.account.serviceRecord?.reverse();
                        this.populateSettings();
                    }
                });
        } else {
            if (forceRefresh) {
                this.accountService
                    .getAccount()
                    ?.pipe(first())
                    .subscribe({
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
        this.account.serviceRecord?.reverse();
        this.populateSettings();

        this.accountService.accountChange$.pipe(takeUntil(this.destroy$)).subscribe({
            next: (newAccount) => {
                this.account = newAccount;
                this.account.serviceRecord?.reverse();
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
            .pipe(first())
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
            .pipe(first())
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
                        '\n\nWe can only see your Steam User ID.' +
                        '\nWe can read no more information about your account than this.',
                    button: 'Continue'
                }
            })
            .afterClosed()
            .pipe(first())
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
                        '\n\nWe can only see your Discord User ID.' +
                        '\nWe can read no more information about your account than this.' +
                        '\nWe will automatically add you to our Discord server.',
                    button: 'Continue'
                }
            })
            .afterClosed()
            .pipe(first())
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
        this.settingsFormGroup.controls.notificationsEmail.setValue(this.account.settings.notificationsEmail);
        this.settingsFormGroup.controls.notificationsTeamspeak.setValue(this.account.settings.notificationsTeamspeak);
        this.settingsFormGroup.controls.sr1Enabled.setValue(this.account.settings.sr1Enabled);
    }

    changeSetting() {
        this.settingsFormGroup.disable();
        this.profileService
            .updateSetting(this.account.id, this.settingsFormGroup.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.getAccount(true);
                    this.settingsFormGroup.enable();
                }
            });
    }

    trackByIndex(index: number): number {
        return index;
    }

    override ngOnDestroy() {
        super.ngOnDestroy();

        if (this.settingsTimeoutId !== null) {
            clearTimeout(this.settingsTimeoutId);
        }
    }
}
