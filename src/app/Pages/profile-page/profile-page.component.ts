import { Component, EventEmitter, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AccountService, MembershipState } from '../../Services/account.service';
import { MatDialog } from '@angular/material';
import { ConnectTeamspeakModalComponent } from '../../Modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { ChangePasswordModalComponent } from '../../Modals/change-password-modal/change-password-modal.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ChangeFirstLastModalComponent } from '../../Modals/change-first-last-modal/change-first-last-modal.component';
import { NgxPermissionsService } from 'ngx-permissions';
import { Permissions } from 'app/Services/permissions';
import { CountryPickerService, ICountry } from 'app/Services/CountryPicker/country-picker.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-profile-page',
    templateUrl: './profile-page.component.html',
    styleUrls: ['./profile-page.component.css']
})
export class ProfilePageComponent implements OnInit {
    static otherTheme;
    static themeUpdateEvent: EventEmitter<null>;
    countries: ICountry[];
    membershipState = MembershipState;
    recruiter;
    admin;
    account;
    accountId;
    settingsFormGroup: FormGroup;

    constructor(
        public dialog: MatDialog,
        private accountService: AccountService,
        private route: ActivatedRoute,
        private httpClient: HttpClient,
        private urls: UrlService,
        private router: Router,
        private formbuilder: FormBuilder,
        private permissions: NgxPermissionsService
    ) {
        this.settingsFormGroup = this.formbuilder.group({
            notificationsEmail: [''],
            notificationsTeamspeak: [''],
            sr1Enabled: ['']
        });
        this.recruiter = this.permissions.getPermissions()[Permissions.SR1];
        this.admin = this.permissions.getPermissions()[Permissions.ADMIN];
        this.countries = CountryPickerService.countries;
    }

    ngOnInit() {
        if (this.route.snapshot.queryParams['steamid']) {
            const id = this.route.snapshot.queryParams['steamid'];
            const code = this.route.snapshot.queryParams['validation'];
            this.httpClient.post(this.urls.apiUrl + '/steamcode/' + id, { code: code }).subscribe(() => {
                this.router.navigate(['/profile']).then(() => {
                    this.getAccount();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: 'Steam successfully connected' }
                    });
                });
            }, error => {
                this.router.navigate(['/profile']).then(() => {
                    this.getAccount();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error.error }
                    });
                });
            });
        } else if (this.route.snapshot.queryParams['discordid']) {
            const id = this.route.snapshot.queryParams['discordid'];
            const code = this.route.snapshot.queryParams['validation'];
            this.httpClient.post(this.urls.apiUrl + '/discordcode/' + id, { code: code }).subscribe(() => {
                this.router.navigate(['/profile']).then(() => {
                    this.getAccount();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: 'Discord successfully connected' }
                    });
                });
            }, error => {
                this.router.navigate(['/profile']).then(() => {
                    this.getAccount();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error.error }
                    });
                });
            });
        } else {
            this.getAccount();
        }
    }

    getAccount() {
        if (this.route.snapshot.params.id) {
            this.accountId = this.route.snapshot.params.id;
            this.httpClient.get(this.urls.apiUrl + '/accounts/' + this.accountId).subscribe(response => {
                this.account = response;
                this.populateSettings();
            });
        } else {
            this.accountService.getAccount(account => {
                this.account = account;
                this.populateSettings();
            })
        }
    }

    get loaded(): boolean {
        return this.account !== null && this.account !== undefined;
    }

    get isMyProfile() {
        return !this.accountId;
    }

    openChangeNameModal() {
        this.dialog.open(ChangeFirstLastModalComponent, {}).afterClosed().subscribe(() => {
            this.getAccount();
        });
    }

    openChangePasswordModal() {
        this.dialog.open(ChangePasswordModalComponent, {});
    }

    openTeamspeakModal() {
        this.dialog.open(ConnectTeamspeakModalComponent).afterClosed().subscribe(() => {
            this.getAccount();
        });
    }

    connectSteam() {
        window.location.href = this.urls.steamUrl + '/steam';
    }

    openDiscordModal() {
        window.location.href = this.urls.steamUrl + '/discord';
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
            this.getAccount();
            this.settingsFormGroup.controls[settingName].enable();
        });
    }

    getServiceRecordNotes(notes) {
        return this.account.nco ? notes : 'You don\'t have permission to view these service record notes';
    }
}
