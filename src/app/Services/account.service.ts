import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { Permissions } from './permissions';
import { ConnectTeamspeakModalComponent } from 'app/Modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { MatDialog } from '@angular/material';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';

@Injectable()
export class AccountService {
    public account;

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
        if (!this.account.teamspeakIdentities || this.account.teamspeakIdentities.length === 0) {
            this.dialog.open(ConfirmationModalComponent, {
                data: { message: 'Your account does not have TeamSpeak connected. Press the button below to connect TeamSpeak', button: 'Connect TeamSpeak' }
            }).componentInstance.confirmEvent.subscribe(() => {
                this.openTeamspeakModal();
            });
        } else if (!this.account.steamname) {
            this.dialog.open(ConfirmationModalComponent, {
                data: { message: 'Your account does not have Steam connected. Press the button below to connect Steam', button: 'Connect Steam' }
            }).componentInstance.confirmEvent.subscribe(() => {
                this.connectSteam();
            });
        } else if (!this.account.discordId) {
            this.dialog.open(ConfirmationModalComponent, {
                data: { message: 'Your account does not have Discord connected. Press the button below to connect Discord', button: 'Connect Discord' }
            }).componentInstance.confirmEvent.subscribe(() => {
                this.openDiscordModal();
            });
        }
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
