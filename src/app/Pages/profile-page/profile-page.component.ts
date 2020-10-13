import { Component, EventEmitter, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AccountService, MembershipState } from '../../Services/account.service';
import { MatDialog } from '@angular/material/dialog';
import { ConnectTeamspeakModalComponent } from '../../Modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { ChangePasswordModalComponent } from '../../Modals/change-password-modal/change-password-modal.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ChangeFirstLastModalComponent } from '../../Modals/change-first-last-modal/change-first-last-modal.component';
import { Permissions } from 'app/Services/permissions';
import { CountryPickerService, ICountry } from 'app/Services/CountryPicker/country-picker.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { Subscription } from 'rxjs';
import { PermissionsService } from 'app/Services/permissions.service';

@Component({
    selector: 'app-profile-page',
    templateUrl: './profile-page.component.html',
    styleUrls: ['./profile-page.component.scss']
})
export class ProfilePageComponent implements OnInit {
    static otherTheme;
    static themeUpdateEvent: EventEmitter<null>;
    countries: ICountry[];
    membershipState = MembershipState;
    account;
    accountId: string;
    settingsFormGroup: FormGroup;
    accountSubscription: Subscription;
    isNco: boolean;
    isAdmin: boolean;
    isRecruiter: boolean;

    constructor(
        public dialog: MatDialog,
        private accountService: AccountService,
        private route: ActivatedRoute,
        private httpClient: HttpClient,
        private urls: UrlService,
        private router: Router,
        private formbuilder: FormBuilder,
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
                    this.dialog.open(MessageModalComponent, {
                        data: { message: 'Steam failed to connect' }
                    }).afterClosed().subscribe(() => {
                        this.accountService.checkConnections();
                    });
                });
            } else {
                const code = this.route.snapshot.queryParams['validation'];
                this.httpClient.post(this.urls.apiUrl + '/steamcode/' + id, { code: code }).subscribe(() => {
                    this.router.navigate(['/profile']).then(() => {
                        this.getAccount();
                        this.dialog.open(MessageModalComponent, {
                            data: { message: 'Steam successfully connected' }
                        }).afterClosed().subscribe(() => {
                            this.accountService.checkConnections();
                        });
                    });
                }, error => {
                    this.router.navigate(['/profile']).then(() => {
                        this.getAccount();
                        this.dialog.open(MessageModalComponent, {
                            data: { message: error.error.error }
                        }).afterClosed().subscribe(() => {
                            this.accountService.checkConnections();
                        });
                    });
                });
            }
        } else if (this.route.snapshot.queryParams['discordid']) {
            const id = this.route.snapshot.queryParams['discordid'];
            if (id === 'fail') {
                this.router.navigate(['/profile']).then(() => {
                    this.getAccount();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: 'Discord failed to connect' }
                    }).afterClosed().subscribe(() => {
                        this.accountService.checkConnections();
                    });
                });
            } else {
                const code = this.route.snapshot.queryParams['validation'];
                const added = this.route.snapshot.queryParams['added'];
                this.httpClient.post(this.urls.apiUrl + '/discordcode/' + id, { code: code }).subscribe(() => {
                    this.router.navigate(['/profile']).then(() => {
                        this.getAccount();
                        if (added === 'true') {
                            this.dialog.open(MessageModalComponent, {
                                data: { message: 'Discord successfully connected' }
                            }).afterClosed().subscribe(() => {
                                this.accountService.checkConnections();
                            });
                        } else {
                            const modal = this.dialog.open(ConfirmationModalComponent, {
                                data: { message: 'Discord successfully connected\n\nWe were unable to add you to our Discord server.\nPlease join by pressing \'Join Discord\'', button: 'Join Discord' }
                            });
                            modal.afterClosed().subscribe(() => {
                                this.accountService.checkConnections();
                            });
                            modal.componentInstance.confirmEvent.subscribe(() => {
                                window.open('https://discord.uk-sf.co.uk', '_blank');
                            });
                        }
                    });
                }, error => {
                    this.router.navigate(['/profile']).then(() => {
                        this.getAccount();
                        this.dialog.open(MessageModalComponent, {
                            data: { message: error.error.error }
                        }).afterClosed().subscribe(() => {
                            this.accountService.checkConnections();
                        });
                    });
                });
            }
        } else {
            this.getAccount();
        }
    }

    getAccount(forceRefresh: boolean = false) {
        if (this.route.snapshot.params.id) {
            this.accountId = this.route.snapshot.params.id;
            this.httpClient.get(this.urls.apiUrl + '/accounts/' + this.accountId).subscribe(response => {
                this.account = response;
                this.populateSettings();
            });
        } else {
            if (forceRefresh) {
                this.accountService.getAccount(account => {
                    this.setAccount(account);
                });
            } else {
                this.setAccount(this.accountService.account);
            }
        }
    }

    private setAccount(account: any) {
        this.account = account;
        this.populateSettings();

        if (this.accountSubscription) {
            this.accountSubscription.unsubscribe();
        }

        this.accountSubscription = this.accountService.accountChange.subscribe((newAccount: any) => {
            this.account = newAccount;
            this.populateSettings();
        });
    }

    get loaded(): boolean {
        return this.account !== null && this.account !== undefined;
    }

    get isMyProfile() {
        return !this.accountId;
    }

    openChangeNameModal() {
        this.dialog.open(ChangeFirstLastModalComponent, {}).afterClosed().subscribe(() => {
            this.getAccount(true);
        });
    }

    openChangePasswordModal() {
        this.dialog.open(ChangePasswordModalComponent, {});
    }

    openTeamspeakModal() {
        this.dialog.open(ConnectTeamspeakModalComponent, { disableClose: true }).afterClosed().subscribe(() => {
            this.getAccount(true);
        });
    }

    connectSteam() {
        this.dialog.open(ConfirmationModalComponent, {
            data: {
                message: 'By pressing \'Continue\' you will be redirected to <b>steamcommunity.com</b> where you will be asked to log in.' +
                    '\nBy doing so, we are able to read only your Steam User ID, which we store in our database for the purpose of verifying you have a valid Steam account and for recruitment communication.' +
                    '\nWe can read no more information about your account than this.' +
                    '\n\nPlease note this is done on the official Steam website, meaning we have zero interaction with your login process.' +
                    '\nIf you have any concerns about this process, please contact UKSF Staff for assistance.',
                button: 'Continue'
            }
        }).componentInstance.confirmEvent.subscribe(() => {
            window.location.href = this.urls.apiUrl + '/steamconnection';
        });
    }

    connectDiscord() {
        this.dialog.open(ConfirmationModalComponent, {
            data: {
                message: 'By pressing \'Continue\' you will be redirected to <b>discord.com</b> where you will be asked to log in.' +
                    '\nBy doing so, we are able to read only your Discord User ID, which we store in our database for the purpose of connectivity between this website and our Discord server.' +
                    '\nWe can read no more information about your account than this.' +
                    '\n\nPlease note this is done on the official Discord website, meaning we have zero interaction with your login process.' +
                    '\nIf you have any concerns about this process, please contact UKSF Staff for assistance.',
                button: 'Continue'
            }
        }).componentInstance.confirmEvent.subscribe(() => {
            window.location.href = this.urls.apiUrl + '/discordconnection';
        });
    }

    get otherTheme() {
        return ProfilePageComponent.otherTheme;
    }

    toggleTheme() {
        ProfilePageComponent.themeUpdateEvent.emit();
    }

    private populateSettings() {
        if (this.account === null || this.account === undefined) {
            setTimeout(() => {
                this.populateSettings();
            }, 100);
            return;
        }
        this.settingsFormGroup.controls['notificationsEmail'].setValue(this.account.settings['notificationsEmail']);
        this.settingsFormGroup.controls['notificationsTeamspeak'].setValue(this.account.settings['notificationsTeamspeak']);
        this.settingsFormGroup.controls['sr1Enabled'].setValue(this.account.settings['sr1Enabled']);
    };

    changeSetting(settingName) {
        this.settingsFormGroup.controls[settingName].disable();
        this.httpClient.post(this.urls.apiUrl + '/accounts/updatesetting/' + this.account.id, {
            name: settingName,
            value: this.settingsFormGroup.controls[settingName].value
        }).subscribe(() => {
            this.getAccount(true);
            this.settingsFormGroup.controls[settingName].enable();
        });
    }
}
