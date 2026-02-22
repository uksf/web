import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { PermissionsService } from './permissions.service';
import { Account, MembershipState } from '@app/shared/models/account';

describe('PermissionsService', () => {
    let service: PermissionsService;
    let mockNgxPermissionsService: any;
    let mockSessionService: any;
    let mockAccountService: any;
    let mockSignalrService: any;
    let mockRouter: any;
    let mockAuthenticationService: any;
    let mockJwtHelperService: any;
    let mockAppSettings: any;
    let mockConnection: any;
    let mockConnectionContainer: any;

    beforeEach(() => {
        const permissions: Record<string, any> = {};
        mockNgxPermissionsService = {
            getPermissions: vi.fn().mockReturnValue(permissions),
            flushPermissions: vi.fn(),
            addPermission: vi.fn().mockImplementation((perm: string) => {
                permissions[perm] = { name: perm };
            }),
            hasPermission: vi.fn().mockResolvedValue(true)
        };

        mockSessionService = {
            hasStorageToken: vi.fn().mockReturnValue(false),
            hasToken: vi.fn().mockReturnValue(false),
            setSessionToken: vi.fn(),
            getSessionToken: vi.fn().mockReturnValue('mock-token'),
            removeTokens: vi.fn()
        };

        mockAccountService = {
            account: undefined as Account | undefined,
            accountChange$: new Subject<Account>(),
            getAccount: vi.fn(),
            clear: vi.fn()
        };

        mockConnection = {
            stop: vi.fn().mockResolvedValue(undefined),
            on: vi.fn()
        };
        mockConnectionContainer = {
            connection: mockConnection,
            reconnectEvent: new Subject<void>(),
            dispose: vi.fn()
        };

        mockSignalrService = {
            connect: vi.fn().mockReturnValue(mockConnectionContainer)
        };

        mockRouter = {
            navigate: vi.fn().mockResolvedValue(true)
        };

        mockAuthenticationService = {
            refresh: vi.fn(),
            logout: vi.fn()
        };

        mockJwtHelperService = {
            decodeToken: vi.fn().mockReturnValue({})
        };

        mockAppSettings = {
            appSetting: vi.fn().mockReturnValue('Production')
        };

        const mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn()
        };

        service = new PermissionsService(
            mockNgxPermissionsService,
            mockSessionService,
            mockAccountService,
            mockSignalrService,
            mockRouter,
            mockAuthenticationService,
            mockJwtHelperService,
            mockAppSettings,
            mockLogger as any
        );
    });

    describe('hasPermission', () => {
        it('returns true when permission exists', () => {
            mockNgxPermissionsService.getPermissions.mockReturnValue({ ADMIN: { name: 'ADMIN' } });

            expect(service.hasPermission('ADMIN')).toBe(true);
        });

        it('returns false when permission does not exist', () => {
            mockNgxPermissionsService.getPermissions.mockReturnValue({});

            expect(service.hasPermission('ADMIN')).toBe(false);
        });
    });

    describe('doesNotHavePermission', () => {
        it('returns true when permission is missing', () => {
            mockNgxPermissionsService.getPermissions.mockReturnValue({});

            expect(service.doesNotHavePermission('ADMIN')).toBe(true);
        });
    });

    describe('hasAnyPermissionOf', () => {
        it('returns true when at least one permission exists', () => {
            mockNgxPermissionsService.getPermissions.mockReturnValue({ MEMBER: { name: 'MEMBER' } });

            expect(service.hasAnyPermissionOf(['ADMIN', 'MEMBER'])).toBe(true);
        });

        it('returns false when no permissions exist', () => {
            mockNgxPermissionsService.getPermissions.mockReturnValue({});

            expect(service.hasAnyPermissionOf(['ADMIN', 'MEMBER'])).toBe(false);
        });
    });

    describe('connect', () => {
        it('connects to SignalR when account is already loaded', async () => {
            mockAccountService.account = { id: 'test-id' } as Account;

            service.connect();

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockSignalrService.connect).toHaveBeenCalledWith('account?userId=test-id');
        });

        it('waits for account change event when account is not yet loaded', async () => {
            mockAccountService.account = undefined;

            service.connect();

            expect(mockSignalrService.connect).not.toHaveBeenCalled();

            mockAccountService.account = { id: 'delayed-id' } as Account;
            mockAccountService.accountChange$.next({ id: 'delayed-id' } as Account);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockSignalrService.connect).toHaveBeenCalledWith('account?userId=delayed-id');
        });

        it('stops existing connection before creating a new one', async () => {
            mockAccountService.account = { id: 'test-id' } as Account;

            service.connect();
            await new Promise(resolve => setTimeout(resolve, 0));

            service.connect();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockConnection.stop).toHaveBeenCalled();
            expect(mockSignalrService.connect).toHaveBeenCalledTimes(2);
        });
    });

    describe('disconnect', () => {
        it('disposes and stops SignalR connection', async () => {
            mockAccountService.account = { id: 'test-id' } as Account;

            service.connect();
            await new Promise(resolve => setTimeout(resolve, 0));

            service.disconnect();

            expect(mockConnectionContainer.dispose).toHaveBeenCalled();
            expect(mockConnection.stop).toHaveBeenCalled();
        });

        it('is safe to call when no connection exists', () => {
            expect(() => service.disconnect()).not.toThrow();
        });
    });

    describe('revoke', () => {
        it('does nothing when already unlogged', () => {
            mockNgxPermissionsService.getPermissions.mockReturnValue({ UNLOGGED: { name: 'UNLOGGED' } });

            service.revoke();

            expect(mockAuthenticationService.logout).not.toHaveBeenCalled();
        });

        it('disconnects SignalR, sets unlogged, logs out, and navigates to login', async () => {
            mockNgxPermissionsService.getPermissions.mockReturnValue({ MEMBER: { name: 'MEMBER' } });
            mockAccountService.account = { id: 'test-id' } as Account;

            service.connect();
            await new Promise(resolve => setTimeout(resolve, 0));

            service.revoke();

            expect(mockConnectionContainer.dispose).toHaveBeenCalled();
            expect(mockConnection.stop).toHaveBeenCalled();
            expect(mockNgxPermissionsService.flushPermissions).toHaveBeenCalled();
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('UNLOGGED');
            expect(mockAuthenticationService.logout).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        });
    });

    describe('refresh', () => {
        it('sets unlogged when no token exists in either storage', async () => {
            mockSessionService.hasToken.mockReturnValue(false);

            await service.refresh();

            expect(mockNgxPermissionsService.flushPermissions).toHaveBeenCalled();
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('UNLOGGED');
        });

        it('refreshes token and fetches account on success', async () => {
            mockSessionService.hasToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            const mockAccount: Account = { id: 'test-id', membershipState: MembershipState.MEMBER } as Account;
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));
            mockAccountService.account = mockAccount;
            mockJwtHelperService.decodeToken.mockReturnValue({
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': []
            });

            await service.refresh();

            expect(mockSessionService.setSessionToken).toHaveBeenCalled();
            expect(mockAuthenticationService.refresh).toHaveBeenCalled();
            expect(mockAccountService.getAccount).toHaveBeenCalled();
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('MEMBER');
        });

        it('works when token is only in sessionStorage (stayLogged=false)', async () => {
            mockSessionService.hasToken.mockReturnValue(true);
            mockSessionService.hasStorageToken.mockReturnValue(false);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            const mockAccount: Account = { id: 'test-id', membershipState: MembershipState.MEMBER } as Account;
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));
            mockAccountService.account = mockAccount;
            mockJwtHelperService.decodeToken.mockReturnValue({
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': []
            });

            await service.refresh();

            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('MEMBER');
        });

        it('redirects to login when interceptor revokes tokens during refresh', async () => {
            mockSessionService.hasToken.mockReturnValue(true);
            // Simulate: interceptor handles 401 by calling revoke(), which removes tokens
            // Then firstValueFrom(EMPTY) throws EmptyError
            mockAuthenticationService.refresh.mockReturnValue(throwError(() => new Error('EmptyError')));
            // After interceptor revoke, tokens are gone
            mockSessionService.hasToken
                .mockReturnValueOnce(true) // initial check
                .mockReturnValueOnce(false); // after refresh failure — tokens revoked by interceptor

            await service.refresh();

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('UNLOGGED');
        });

        it('tolerates transient token refresh error and still fetches account', async () => {
            mockSessionService.hasToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(throwError(() => ({ statusCode: 0 })));
            const mockAccount: Account = { id: 'test-id', membershipState: MembershipState.MEMBER } as Account;
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));
            mockAccountService.account = mockAccount;
            mockJwtHelperService.decodeToken.mockReturnValue({
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': []
            });

            await service.refresh();

            expect(mockSessionService.removeTokens).not.toHaveBeenCalled();
            expect(mockRouter.navigate).not.toHaveBeenCalled();
            expect(mockAccountService.getAccount).toHaveBeenCalled();
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('MEMBER');
        });

        it('preserves session when account fetch fails with transient error and token exists', async () => {
            mockSessionService.hasToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            mockAccountService.getAccount.mockReturnValue(throwError(() => ({ statusCode: 0 })));

            await service.refresh();

            expect(mockSessionService.removeTokens).not.toHaveBeenCalled();
            expect(mockRouter.navigate).not.toHaveBeenCalled();
        });

        it('redirects to login when account fetch fails and interceptor revoked tokens', async () => {
            mockSessionService.hasToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            mockAccountService.getAccount.mockReturnValue(throwError(() => ({ statusCode: 401 })));
            // After interceptor handles 401, token is gone
            mockSessionService.hasToken
                .mockReturnValueOnce(true) // initial check
                .mockReturnValueOnce(false); // after account fetch failure — interceptor revoked

            await service.refresh();

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('UNLOGGED');
        });

        it('preserves session when API is unreachable but token still exists', async () => {
            mockSessionService.hasToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(throwError(() => ({ statusCode: 0 })));
            mockAccountService.getAccount.mockReturnValue(throwError(() => ({ statusCode: 0 })));

            await service.refresh();

            expect(mockSessionService.removeTokens).not.toHaveBeenCalled();
            expect(mockRouter.navigate).not.toHaveBeenCalled();
        });

        it('sets unlogged when getAccount returns null', async () => {
            mockSessionService.hasToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            mockAccountService.getAccount.mockReturnValue(null);

            await service.refresh();

            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('UNLOGGED');
        });

        it('returns shared Promise for concurrent callers', async () => {
            mockSessionService.hasToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            const mockAccount: Account = { id: 'test-id', membershipState: MembershipState.MEMBER } as Account;
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));
            mockAccountService.account = mockAccount;
            mockJwtHelperService.decodeToken.mockReturnValue({
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': []
            });

            const promise1 = service.refresh();
            const promise2 = service.refresh();

            expect(promise1).toBe(promise2);

            await Promise.all([promise1, promise2]);

            expect(mockAuthenticationService.refresh).toHaveBeenCalledTimes(1);
        });

        it('allows new refresh after previous one completes', async () => {
            mockSessionService.hasToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            const mockAccount: Account = { id: 'test-id', membershipState: MembershipState.MEMBER } as Account;
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));
            mockAccountService.account = mockAccount;
            mockJwtHelperService.decodeToken.mockReturnValue({
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': []
            });

            await service.refresh();
            await service.refresh();

            expect(mockAuthenticationService.refresh).toHaveBeenCalledTimes(2);
        });
    });
});
