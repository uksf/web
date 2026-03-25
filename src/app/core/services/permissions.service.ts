import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { AccountService } from './account.service';
import { SessionService } from './authentication/session.service';
import { Permissions } from './permissions';
import { AccountHubService } from './account-hub.service';
import { AuthenticationService } from './authentication/authentication.service';
import { Account, MembershipState } from '@app/shared/models/account';
import { UksfError } from '@app/shared/models/response';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AppSettingsService, Environments } from './app-settings.service';
import { LoggingService } from './logging.service';
import { DebouncedCallback } from '@app/shared/utils/debounce-callback';

@Injectable()
export class PermissionsService {
    private ngxPermissionsService = inject(NgxPermissionsService);
    private sessionService = inject(SessionService);
    private accountService = inject(AccountService);
    private accountHub = inject(AccountHubService);
    private router = inject(Router);
    private authenticationService = inject(AuthenticationService);
    private jwtHelperService = inject(JwtHelperService);
    private appSettings = inject(AppSettingsService);
    private logger = inject(LoggingService);

    private jwtRolesKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    private refreshPromise: Promise<void> | null = null;
    private revoked = false;
    private debouncedUpdate = new DebouncedCallback();
    private reconnectSubscription: Subscription | null = null;
    private onAccountUpdate = () => {
        this.debouncedUpdate.schedule(() => {
            this.refresh().then();
        });
    };
    public accountUpdateEvent = new Subject<void>();

    connect() {
        this.disconnect();
        this.accountHub.connect();
        this.accountHub.on('ReceiveAccountUpdate', this.onAccountUpdate);
        this.reconnectSubscription = this.accountHub.reconnected$.subscribe({
            next: () => {
                this.debouncedUpdate.schedule(() => {
                    this.refresh().then();
                });
            }
        });
    }

    disconnect() {
        this.debouncedUpdate.cancel();
        this.reconnectSubscription?.unsubscribe();
        this.reconnectSubscription = null;
        this.accountHub.off('ReceiveAccountUpdate', this.onAccountUpdate);
        this.accountHub.disconnect();
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

    public refresh(): Promise<void> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.doRefresh().finally(() => {
            this.refreshPromise = null;
        });

        return this.refreshPromise;
    }

    public revoke(): void {
        if (this.hasPermission(Permissions.UNLOGGED)) {
            return;
        }

        this.revoked = true;
        this.disconnect();
        this.setUnlogged();
        this.authenticationService.logout();
        this.router.navigate(['/login']);
    }

    private async doRefresh(): Promise<void> {
        this.revoked = false;

        if (!this.sessionService.hasToken()) {
            this.setUnlogged();
            return;
        }

        this.sessionService.setSessionToken();

        try {
            await firstValueFrom(this.authenticationService.refresh());
        } catch (refreshError: unknown) {
            this.logger.warn('PermissionsService', 'Token refresh failed', refreshError);
            if (this.isNetworkError(refreshError)) {
                // Network is temporarily down but token may still be valid.
                // Don't kick user to login — the next reconnect or API call will retry.
                return;
            }
            if (!this.sessionService.hasToken()) {
                this.setUnlogged();
                this.router.navigate(['/login']);
                return;
            }
        }

        const account$ = this.accountService.getAccount();
        if (!account$) {
            this.setUnlogged();
            return;
        }

        try {
            const account = await firstValueFrom(account$);
            if (this.revoked) {
                return;
            }
            this.setPermissions(account);
            this.connect();
            this.accountUpdateEvent.next();
        } catch (accountError: unknown) {
            this.logger.warn('PermissionsService', 'Account fetch failed', accountError);
            if (this.isNetworkError(accountError)) {
                // Network is temporarily down — don't disrupt the user's session.
                return;
            }
            if (!this.sessionService.hasToken()) {
                this.setUnlogged();
                this.router.navigate(['/login']);
            }
        }
    }

    private setPermissions(account: Account) {
        this.ngxPermissionsService.flushPermissions();
        if (account.membershipState === MembershipState.MEMBER) {
            this.ngxPermissionsService.addPermission(Permissions.MEMBER);

            const jwtData = this.jwtHelperService.decodeToken(this.sessionService.getSessionToken());
            const tokenPermissions: string[] = jwtData[this.jwtRolesKey];
            const lookup = Permissions.LookUp();

            Object.entries(lookup).forEach(([role, permissions]) => {
                if (tokenPermissions.includes(role)) {
                    this.ngxPermissionsService.addPermission(permissions);
                }
            });
        } else if (account.membershipState === MembershipState.CONFIRMED) {
            this.ngxPermissionsService.addPermission(Permissions.CONFIRMED);
        } else {
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

    private isNetworkError(error: unknown): boolean {
        return typeof error === 'object' && error !== null && (error as UksfError).statusCode === 0;
    }

}
