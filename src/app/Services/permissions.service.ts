import { Injectable, EventEmitter } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { AccountService, MembershipState } from './account.service';
import { SessionService } from './Authentication/session.service';
import { Permissions } from './permissions';
import { ConnectionContainer, SignalRService } from './signalr.service';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { StatesService } from './states.service';

@Injectable()
export class PermissionsService {
    private accountHubConnection: ConnectionContainer;
    private refreshing = false;
    private updateTimeout;
    public accountUpdateEvent = new EventEmitter();

    constructor(
        private ngxPermissionsService: NgxPermissionsService,
        private sessionService: SessionService,
        private accountService: AccountService,
        private signalrService: SignalRService,
        private httpClient: HttpClient,
        private urls: UrlService
    ) {
        this.waitForId().then(id => {
            this.accountHubConnection = this.signalrService.connect(`account?userId=${id}`);
            this.accountHubConnection.connection.on('ReceiveAccountUpdate', () => {
                this.mergeUpdates(() => {
                    this.updateAccount();
                });
            });
            this.accountHubConnection.reconnectEvent.subscribe(() => {
                this.mergeUpdates(() => {
                    this.updateAccount();
                });
            });
        });
    }

    async refresh() {
        if (this.refreshing) { return; }
        this.refreshing = true;
        try {
            const promise = new Promise((resolve, reject) => {
                this.ngxPermissionsService.flushPermissions();
                if (this.sessionService.hasStorageToken()) {
                    // logged in
                    this.sessionService.setSessionToken();
                    this.accountService.getAccount(account => {
                        if (account.membershipState === MembershipState.MEMBER) {
                            // member
                            this.ngxPermissionsService.addPermission(Permissions.MEMBER);
                            if (account.permissionSr1) {
                                this.ngxPermissionsService.addPermission(Permissions.SR1);
                                this.ngxPermissionsService.addPermission(Permissions.ACTIVITY);
                                this.ngxPermissionsService.addPermission(Permissions.DISCHARGES);
                            }
                            if (account.permissionSr5) {
                                this.ngxPermissionsService.addPermission(Permissions.SR5);
                                this.ngxPermissionsService.addPermission(Permissions.SERVERS);
                            }
                            if (account.permissionSr10) {
                                this.ngxPermissionsService.addPermission(Permissions.SR10);
                            }
                            if (account.permissionSr1Lead) {
                                this.ngxPermissionsService.addPermission(Permissions.SR1_LEAD);
                            }
                            if (account.permissionCommand) {
                                this.ngxPermissionsService.addPermission(Permissions.COMMAND);
                                this.ngxPermissionsService.addPermission(Permissions.ACTIVITY);
                            }
                            if (account.permissionNco) {
                                this.ngxPermissionsService.addPermission(Permissions.NCO);
                                this.ngxPermissionsService.addPermission(Permissions.SERVERS);
                                this.ngxPermissionsService.addPermission(Permissions.ACTIVITY);
                                this.ngxPermissionsService.addPermission(Permissions.DISCHARGES);
                            }
                            if (account.permissionAdmin) {
                                this.ngxPermissionsService.addPermission(Permissions.ADMIN);
                            }
                        } else if (account.membershipState === MembershipState.CONFIRMED) {
                            // guest
                            this.ngxPermissionsService.addPermission(Permissions.CONFIRMED);
                        } else {
                            // unconfirmed, any else
                            this.ngxPermissionsService.addPermission(Permissions.UNCONFIRMED);
                        }
                        resolve();
                    }, () => {
                        reject('Token invalid, resetting');
                    });
                } else {
                    // not logged in
                    this.ngxPermissionsService.addPermission(Permissions.UNLOGGED);
                    resolve();
                }
            })
            promise.then(() => {
                this.refreshing = false;
            }).catch(reason => {
                this.refreshing = false;
                console.log(reason);
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace('/login');
            });
            return promise;
        } catch (error) {
            console.log(error);
        }
    }

    private mergeUpdates(callback: () => void) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            callback();
        }, 500);
    }

    private updateAccount() {
        this.httpClient.get(this.urls.apiUrl + '/login/refresh').subscribe((response: any) => {
            this.sessionService.setSessionToken(response);
            if (StatesService.stayLogged) {
                this.sessionService.setStorageToken();
            }
            this.refresh().then(() => {
                this.accountUpdateEvent.emit();
            }).catch(_ => {
                this.accountUpdateEvent.emit();
            });
        }, _ => {
            console.log('Account was refreshed but something failed');
        });
    }

    private waitForId(): Promise<string> {
        return new Promise<string>(async (resolve) => {
            while (!this.accountService.account || !this.accountService.account.id) {
                await this.delay(100);
            }
            resolve(this.accountService.account.id);
        });
    }

    async delay(delay: number) { return new Promise(resolve => setTimeout(resolve, delay)); }
}
