import { Injectable } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { AccountService } from './account.service';
import { SessionService } from './authentication/session.service';
import { Permissions } from './permissions';
import { ConnectionContainer, SignalRService } from './signalr.service';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { AuthenticationService } from './authentication/authentication.service';
import { Account, MembershipState } from '@app/shared/models/account';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AppSettingsService, Environments } from './app-settings.service';
import { LoggingService } from './logging.service';
import { DebouncedCallback } from '@app/shared/utils/debounce-callback';

@Injectable()
export class PermissionsService {
    private jwtRolesKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    private accountHubConnection: ConnectionContainer;
    private refreshing = false;
    private debouncedUpdate = new DebouncedCallback();
    public accountUpdateEvent = new Subject<void>();

    constructor(
        private ngxPermissionsService: NgxPermissionsService,
        private sessionService: SessionService,
        private accountService: AccountService,
        private signalrService: SignalRService,
        private httpClient: HttpClient,
        private urls: UrlService,
        private authenticationService: AuthenticationService,
        private jwtHelperService: JwtHelperService,
        private appSettings: AppSettingsService,
        private logger: LoggingService
    ) {}

    connect() {
        if (this.accountHubConnection !== undefined) {
            this.accountHubConnection.dispose();
            this.accountHubConnection.connection.stop().then();
        }

        this.waitForId().then((id) => {
            this.accountHubConnection = this.signalrService.connect(`account?userId=${id}`);
            this.accountHubConnection.connection.on('ReceiveAccountUpdate', () => {
                this.debouncedUpdate.schedule(() => {
                    this.refresh().then();
                });
            });
            this.accountHubConnection.reconnectEvent.subscribe({
                next: () => {
                    this.debouncedUpdate.schedule(() => {
                        this.refresh().then();
                    });
                }
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
                    this.authenticationService.refresh().subscribe({
                        next: () => {
                            // logged in
                            this.accountService.getAccount()?.subscribe({
                                next: (account) => {
                                    this.setPermissions(account);
                                    this.connect();
                                    resolve(null);
                                },
                                error: () => {
                                    reject('Token invalid, resetting');
                                }
                            });
                        },
                        error: (error) => {
                            reject(error?.error || error);
                        }
                    });
                } else {
                    // not logged in
                    this.setUnlogged();
                    resolve(null);
                }
            });
            promise
                .then(() => {
                    this.refreshing = false;
                    this.accountUpdateEvent.next();
                })
                .catch((reason) => {
                    this.refreshing = false;
                    this.logger.error('PermissionsService', 'Refresh failed', reason);
                    localStorage.clear();
                    sessionStorage.clear();
                    this.setUnlogged();
                    window.location.replace('/login');
                });
            return promise;
        } catch (error) {
            this.logger.error('PermissionsService', 'Unexpected error during refresh', error);
        }
    }

    public revoke(redirectAfterLogin?: string) {
        if (this.hasPermission(Permissions.UNLOGGED)) {
            return;
        }

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
        } else if (account.membershipState === MembershipState.CONFIRMED) {
            // guest
            this.ngxPermissionsService.addPermission(Permissions.CONFIRMED);
        } else {
            // unconfirmed, any else
            this.ngxPermissionsService.addPermission(Permissions.UNCONFIRMED);
        }

        if (this.appSettings.appSetting('environment') === Environments.Development) {
            this.logger.debug('PermissionsService', 'Permissions:', this.getPermissions());
        }
    }

    private setUnlogged() {
        this.ngxPermissionsService.flushPermissions();
        this.ngxPermissionsService.addPermission(Permissions.UNLOGGED);
    }

    private waitForId(): Promise<string> {
        if (this.accountService.account?.id) {
            return Promise.resolve(this.accountService.account.id);
        }

        return new Promise<string>((resolve) => {
            const subscription = this.accountService.accountChange$.subscribe({
                next: (account: Account) => {
                    if (account?.id) {
                        subscription.unsubscribe();
                        resolve(account.id);
                    }
                }
            });
        });
    }

}
