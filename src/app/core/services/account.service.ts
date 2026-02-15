import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap, first } from 'rxjs';
import { UrlService } from './url.service';
import { ConnectTeamspeakModalComponent } from '@app/features/profile/modals/connect-teamspeak-modal/connect-teamspeak-modal.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { SessionService } from './authentication/session.service';
import { Account, MembershipState } from '@app/shared/models/account';

@Injectable()
export class AccountService {
    public accountChange$ = new Subject<Account>();
    public account: Account;
    private openDialog: MatDialogRef<ConfirmationModalComponent, any> = undefined;

    constructor(private httpClient: HttpClient, private urls: UrlService, private sessionService: SessionService, public dialog: MatDialog) {}

    public getAccount(): Observable<Account> | undefined {
        if (this.sessionService.hasToken()) {
            return this.httpClient.get<Account>(this.urls.apiUrl + '/accounts').pipe(
                tap({
                    next: (account) => {
                        this.account = account;
                        this.checkConnections();
                        this.accountChange$.next(account);
                    },
                    error: () => {
                        this.clear();
                    }
                })
            );
        }
        return undefined;
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
                    data: { message: 'Your account does not have TeamSpeak connected. Press the button below to connect TeamSpeak', button: 'Connect TeamSpeak' }
                });
                this.openDialog.afterClosed().subscribe({
                    next: (result) => {
                        this.openDialog = undefined;
                        if (result) {
                            this.openTeamspeakModal();
                        }
                    }
                });
            } else if (!this.account.steamname) {
                this.openDialog = this.dialog.open(ConfirmationModalComponent, {
                    data: { message: 'Your account does not have Steam connected. Press the button below to connect Steam', button: 'Connect Steam' }
                });
                this.openDialog.afterClosed().subscribe({
                    next: (result) => {
                        this.openDialog = undefined;
                        if (result) {
                            this.connectSteam();
                        }
                    }
                });
            } else if (!this.account.discordId) {
                this.openDialog = this.dialog.open(ConfirmationModalComponent, {
                    data: { message: 'Your account does not have Discord connected. Press the button below to connect Discord', button: 'Connect Discord' }
                });
                this.openDialog.afterClosed().subscribe({
                    next: (result) => {
                        this.openDialog = undefined;
                        if (result) {
                            this.connectDiscord();
                        }
                    }
                });
            }
        }
    }

    openTeamspeakModal() {
        this.dialog
            .open(ConnectTeamspeakModalComponent, { disableClose: true })
            .afterClosed()
            .subscribe({
                next: () => {
                    this.getAccount()?.pipe(first()).subscribe();
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
