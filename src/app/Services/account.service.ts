import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { Permissions } from './permissions';
import { ConnectTeamspeakModalComponent } from 'app/Modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';

@Injectable()
export class AccountService {
    public accountChange: EventEmitter<any> = new EventEmitter();
    public account;
    private openDialog: MatDialogRef<ConfirmationModalComponent, any> = undefined;

    constructor(
        private httpClient: HttpClient,
        private urls: UrlService,
        private ngxPermissionsService: NgxPermissionsService,
        public dialog: MatDialog
    ) {
    }

    public getAccount(callback: (any) => void = null, callbackError: () => void = null) {
        if (!this.ngxPermissionsService.getPermissions()[Permissions.UNLOGGED]) {
            const subscribable = this.httpClient.get(this.urls.apiUrl + '/accounts');
            subscribable.subscribe((response: any) => {
                const account = response;
                this.account = account;
                this.checkConnections();
                if (callback) {
                    callback(account);
                }
                this.accountChange.emit(account);
            }, _ => {
                this.clear();
                if (callbackError) {
                    callbackError();
                }
            });
            return subscribable;
        }
    }

    checkConnections() {
        if (window.location.href.indexOf('validation') !== -1) { return; }
        if (window.location.href.indexOf('application') !== -1) { return; }
        if (!this.openDialog) {
            if (!this.account.teamspeakIdentities || this.account.teamspeakIdentities.length === 0) {
                this.openDialog = this.dialog.open(ConfirmationModalComponent, {
                    data: { message: 'Your account does not have TeamSpeak connected. Press the button below to connect TeamSpeak', button: 'Connect TeamSpeak' }
                });
                this.openDialog.componentInstance.confirmEvent.subscribe(() => {
                    this.openTeamspeakModal();
                });
                this.openDialog.afterClosed().subscribe(() => {
                    this.openDialog = undefined;
                });
            } else if (!this.account.steamname) {
                this.openDialog = this.dialog.open(ConfirmationModalComponent, {
                    data: { message: 'Your account does not have Steam connected. Press the button below to connect Steam', button: 'Connect Steam' }
                });
                this.openDialog.componentInstance.confirmEvent.subscribe(() => {
                    this.connectSteam();
                });
                this.openDialog.afterClosed().subscribe(() => {
                    this.openDialog = undefined;
                });
            } else if (!this.account.discordId) {
                this.openDialog = this.dialog.open(ConfirmationModalComponent, {
                    data: { message: 'Your account does not have Discord connected. Press the button below to connect Discord', button: 'Connect Discord' }
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
        this.dialog.open(ConnectTeamspeakModalComponent, { disableClose: true }).afterClosed().subscribe((result: number) => {
            if (result === 0) {
                this.getAccount();
            }
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
    DISCHARGED
}

export enum ApplicationState {
    ACCEPTED,
    REJECTED,
    WAITING
}
