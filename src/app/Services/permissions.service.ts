import { Injectable, EventEmitter } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { AccountService } from './account.service';
import { SessionService } from './Authentication/session.service';
import { Permissions } from './permissions';
import { ConnectionContainer, SignalRService } from './signalr.service';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { AuthenticationService } from './Authentication/authentication.service';
import { Account, MembershipState } from '../Models/Account';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable()
export class PermissionsService {
    private jwtRolesKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    private accountHubConnection: ConnectionContainer;
    private refreshing = false;
    private updateTimeout: NodeJS.Timeout;
    public accountUpdateEvent = new EventEmitter();

    constructor(
        private ngxPermissionsService: NgxPermissionsService,
        private sessionService: SessionService,
        private accountService: AccountService,
        private signalrService: SignalRService,
        private httpClient: HttpClient,
        private urls: UrlService,
        private authenticationService: AuthenticationService,
        private jwtHelperService: JwtHelperService
    ) {
        this.waitForId().then((id) => {
            this.accountHubConnection = this.signalrService.connect(`account?userId=${id}`);
            this.accountHubConnection.connection.on('ReceiveAccountUpdate', () => {
                this.mergeUpdates(() => {
                    this.refresh().then();
                });
            });
            this.accountHubConnection.reconnectEvent.subscribe(() => {
                this.mergeUpdates(() => {
                    this.refresh().then();
                });
            });
        });
    }

    hasPermission(permission: string) {
        return this.ngxPermissionsService.getPermissions()[permission] !== undefined;
    }

    doesNotHavePermission(permission: string) {
        return !this.hasPermission(permission);
    }

    hasAnyPermissionOf(permissions: string[]) {
        return permissions.some((permission) => {
            return this.hasPermission(permission);
        });
    }

    hasAllPermissionsOf(permissions: string[]) {
        return this.ngxPermissionsService.hasPermission(permissions);
    }

    getPermissions() {
        return this.ngxPermissionsService.getPermissions();
    }

    public async refresh(): Promise<any> {
        if (this.refreshing) {
            return;
        }
        this.refreshing = true;
        try {
            const promise = new Promise((resolve, reject) => {
                if (this.sessionService.hasStorageToken()) {
                    this.sessionService.setSessionToken();
                    this.authenticationService.refresh(() => {
                        // logged in
                        this.accountService.getAccount(
                            (account) => {
                                this.setPermissions(account);
                                resolve();
                            },
                            () => {
                                reject('Token invalid, resetting');
                            }
                        );
                    });
                } else {
                    // not logged in
                    this.setUnlogged();
                    resolve();
                }
            });
            promise
                .then(() => {
                    this.refreshing = false;
                    this.accountUpdateEvent.emit();
                })
                .catch((reason) => {
                    this.refreshing = false;
                    console.log(reason);
                    localStorage.clear();
                    sessionStorage.clear();
                    this.setUnlogged();
                    window.location.replace('/login');
                });
            return promise;
        } catch (error) {
            console.log(error);
        }
    }

    public revoke(redirectAfterLogin?: string) {
        this.authenticationService.logout(redirectAfterLogin);
        this.setUnlogged();
    }

    private setPermissions(account: Account) {
        this.ngxPermissionsService.flushPermissions();
        if (account.membershipState === MembershipState.MEMBER) {
            // member
            this.ngxPermissionsService.addPermission(Permissions.MEMBER);

            let jwtData = this.jwtHelperService.decodeToken(this.sessionService.getSessionToken());
            let tokenPermissions: string[] = jwtData[this.jwtRolesKey];
            let lookup = Permissions.LookUp();

            Object.entries(lookup).forEach(([role, permissions]) => {
                if (tokenPermissions.includes(role)) {
                    this.ngxPermissionsService.addPermission(permissions);
                }
            });

            // TODO: Convert to lookup table to resolve permissions by roles
            // if (permissions[Permissions.ADMIN]) {
            //     this.ngxPermissionsService.addPermission(Permissions.ADMIN);
            // }
            // if (permissions[Permissions.COMMAND]) {
            //     this.ngxPermissionsService.addPermission(Permissions.COMMAND);
            //     this.ngxPermissionsService.addPermission(Permissions.ACTIVITY);
            // }
            // if (permissions[Permissions.NCO]) {
            //     this.ngxPermissionsService.addPermission(Permissions.NCO);
            //     this.ngxPermissionsService.addPermission(Permissions.SERVERS);
            //     this.ngxPermissionsService.addPermission(Permissions.ACTIVITY);
            //     this.ngxPermissionsService.addPermission(Permissions.DISCHARGES);
            // }
            // if (permissions[Permissions.PERSONNEL]) {
            //     this.ngxPermissionsService.addPermission(Permissions.PERSONNEL);
            // }
            // if (permissions[Permissions.RECRUITER]) {
            //     this.ngxPermissionsService.addPermission(Permissions.RECRUITER);
            //     this.ngxPermissionsService.addPermission(Permissions.ACTIVITY);
            //     this.ngxPermissionsService.addPermission(Permissions.DISCHARGES);
            // }
            // if (permissions[Permissions.RECRUITER_LEAD]) {
            //     this.ngxPermissionsService.addPermission(Permissions.RECRUITER_LEAD);
            // }
            // if (permissions[Permissions.SERVERS]) {
            //     this.ngxPermissionsService.addPermission(Permissions.SERVERS);
            // }
            // if (permissions[Permissions.TESTER]) {
            //     this.ngxPermissionsService.addPermission(Permissions.TESTER);
            // }
        } else if (account.membershipState === MembershipState.CONFIRMED) {
            // guest
            this.ngxPermissionsService.addPermission(Permissions.CONFIRMED);
        } else {
            // unconfirmed, any else
            this.ngxPermissionsService.addPermission(Permissions.UNCONFIRMED);
        }
    }

    private resolvePermissionsFromRole(role: string) {}

    private setUnlogged() {
        this.ngxPermissionsService.flushPermissions();
        this.ngxPermissionsService.addPermission(Permissions.UNLOGGED);
    }

    private waitForId(): Promise<string> {
        return new Promise<string>(async (resolve) => {
            while (!this.accountService.account || !this.accountService.account.id) {
                await this.delay(100);
            }
            resolve(this.accountService.account.id);
        });
    }

    private mergeUpdates(callback: () => void) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            callback();
        }, 500);
    }

    private async delay(delay: number) {
        return new Promise((resolve) => setTimeout(resolve, delay));
    }
}
