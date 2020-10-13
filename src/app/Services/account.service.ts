import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { ConnectTeamspeakModalComponent } from 'app/Modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { SessionService } from './Authentication/session.service';

@Injectable()
export class AccountService {
    public accountChange: EventEmitter<any> = new EventEmitter();
    public account: Account;
    private openDialog: MatDialogRef<ConfirmationModalComponent, any> = undefined;

    constructor(private httpClient: HttpClient, private urls: UrlService, private sessionService: SessionService, public dialog: MatDialog) {}

    public getAccount(callback: (arg0: Account) => void = null, callbackError: () => void = null) {
        if (this.sessionService.hasStorageToken()) {
            const subscribable = this.httpClient.get(this.urls.apiUrl + '/accounts');
            subscribable.subscribe(
                (response: any) => {
                    const account = response;
                    this.account = account;
                    this.checkConnections();
                    if (callback) {
                        callback(account);
                    }
                    this.accountChange.emit(account);
                },
                (_) => {
                    this.clear();
                    if (callbackError) {
                        callbackError();
                    }
                }
            );
            return subscribable;
        }
    }

    public checkConnections() {
        if (window.location.href.indexOf('validation') !== -1) {
            return;
        }
        if (window.location.href.indexOf('application') !== -1) {
            return;
        }

        if (this.dialog.openDialogs.length > 0) {
            return;
        }

        if (!this.openDialog) {
            if (this.account.membershipState !== MembershipState.MEMBER) {
                return;
            }

            if (!this.account.teamspeakIdentities || this.account.teamspeakIdentities.length === 0) {
                this.openDialog = this.dialog.open(ConfirmationModalComponent, {
                    data: { message: 'Your account does not have TeamSpeak connected. Press the button below to connect TeamSpeak', button: 'Connect TeamSpeak' },
                });
                this.openDialog.componentInstance.confirmEvent.subscribe(() => {
                    this.openTeamspeakModal();
                });
                this.openDialog.afterClosed().subscribe(() => {
                    this.openDialog = undefined;
                });
            } else if (!this.account.steamname) {
                this.openDialog = this.dialog.open(ConfirmationModalComponent, {
                    data: { message: 'Your account does not have Steam connected. Press the button below to connect Steam', button: 'Connect Steam' },
                });
                this.openDialog.componentInstance.confirmEvent.subscribe(() => {
                    this.connectSteam();
                });
                this.openDialog.afterClosed().subscribe(() => {
                    this.openDialog = undefined;
                });
            } else if (!this.account.discordId) {
                this.openDialog = this.dialog.open(ConfirmationModalComponent, {
                    data: { message: 'Your account does not have Discord connected. Press the button below to connect Discord', button: 'Connect Discord' },
                });
                this.openDialog.componentInstance.confirmEvent.subscribe(() => {
                    this.connectDiscord();
                });
                this.openDialog.afterClosed().subscribe(() => {
                    this.openDialog = undefined;
                });
            }
        }
    }

    openTeamspeakModal() {
        this.dialog
            .open(ConnectTeamspeakModalComponent, { disableClose: true })
            .afterClosed()
            .subscribe(() => {
                this.getAccount();
            });
    }

    connectSteam() {
        window.location.href = this.urls.apiUrl + '/steamconnection';
    }

    connectDiscord() {
        window.location.href = this.urls.apiUrl + '/discordconnection';
    }

    public clear() {
        this.account = undefined;
    }
}

export enum MembershipState {
    UNCONFIRMED,
    CONFIRMED,
    MEMBER,
    DISCHARGED,
}

export enum ApplicationState {
    ACCEPTED,
    REJECTED,
    WAITING,
}

export interface Account {
    id: string;
    application: Application;
    armaExperience: string;
    background: string;
    discordId: string;
    dob: Date;
    email: string;
    firstname: string;
    lastname: string;
    membershipState: MembershipState;
    militaryExperience: boolean;
    nation: string;
    rank: string;
    reference: string;
    roleAssignment: string;
    rolePreferences: string[];
    serviceRecord: ServiceRecordEntry[];
    settings: AccountSettings;
    steamname: string;
    teamspeakIdentities: number[];
    unitAssignment: string;
    unitsExperience: string;

    displayName: string;
    permissions: AccountPermissions;
}

export interface AccountPermissions {
    admin: boolean;
    command: boolean;
    nco: boolean;
    personnel: boolean;
    recruiter: boolean;
    recruiterLead: boolean;
    servers: boolean;
    tester: boolean;
}

export interface AccountSettings {
    notificationsEmail: boolean;
    notificationsTeamspeak: boolean;
    sr1Enabled: boolean;
}

export interface ServiceRecordEntry {
    notes: string;
    occurence: string;
    timestamp: Date;
}

export interface Application {
    applicationCommentThread: string;
    dateAccepted: Date;
    dateCreated: Date;
    ratings: { [id: string]: number };
    recruiter: string;
    recruiterCommentThread: string;
    state: ApplicationState;
}
