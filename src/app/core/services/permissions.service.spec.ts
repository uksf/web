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

            // Give microtask queue time to resolve
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockSignalrService.connect).toHaveBeenCalledWith('account?userId=test-id');
        });

        it('waits for account change event when account is not yet loaded', async () => {
            mockAccountService.account = undefined;

            service.connect();

            // SignalR should not have been called yet
            expect(mockSignalrService.connect).not.toHaveBeenCalled();

            // Simulate account loading
            mockAccountService.account = { id: 'delayed-id' } as Account;
            mockAccountService.accountChange$.next({ id: 'delayed-id' } as Account);

            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockSignalrService.connect).toHaveBeenCalledWith('account?userId=delayed-id');
        });

        it('stops existing connection before creating a new one', async () => {
            mockAccountService.account = { id: 'test-id' } as Account;

            service.connect();
            await new Promise(resolve => setTimeout(resolve, 0));

            // Connect again
            service.connect();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockConnection.stop).toHaveBeenCalled();
            expect(mockSignalrService.connect).toHaveBeenCalledTimes(2);
        });
    });

    describe('revoke', () => {
        it('does nothing when already unlogged', () => {
            mockNgxPermissionsService.getPermissions.mockReturnValue({ UNLOGGED: { name: 'UNLOGGED' } });

            service.revoke();

            expect(mockAuthenticationService.logout).not.toHaveBeenCalled();
        });

        it('calls logout and sets unlogged when logged in', () => {
            mockNgxPermissionsService.getPermissions.mockReturnValue({ MEMBER: { name: 'MEMBER' } });

            service.revoke();

            expect(mockAuthenticationService.logout).toHaveBeenCalled();
            expect(mockNgxPermissionsService.flushPermissions).toHaveBeenCalled();
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('UNLOGGED');
        });
    });

    describe('refresh', () => {
        it('sets unlogged when no storage token exists', async () => {
            mockSessionService.hasStorageToken.mockReturnValue(false);

            await service.refresh();

            expect(mockNgxPermissionsService.flushPermissions).toHaveBeenCalled();
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('UNLOGGED');
        });

        it('refreshes token and fetches account on success', async () => {
            mockSessionService.hasStorageToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            const mockAccount: Account = { id: 'test-id', membershipState: MembershipState.MEMBER } as Account;
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));
            mockJwtHelperService.decodeToken.mockReturnValue({
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': []
            });

            await service.refresh();

            expect(mockSessionService.setSessionToken).toHaveBeenCalled();
            expect(mockAuthenticationService.refresh).toHaveBeenCalled();
            expect(mockAccountService.getAccount).toHaveBeenCalled();
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('MEMBER');
        });

        it('navigates to login on 401 during token refresh', async () => {
            mockSessionService.hasStorageToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(throwError(() => ({ status: 401 })));

            await service.refresh();

            expect(mockSessionService.removeTokens).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('UNLOGGED');
        });

        it('navigates to login on 403 during token refresh', async () => {
            mockSessionService.hasStorageToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(throwError(() => ({ status: 403 })));

            await service.refresh();

            expect(mockSessionService.removeTokens).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        });

        it('tolerates transient errors during token refresh and still fetches account', async () => {
            mockSessionService.hasStorageToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(throwError(() => ({ status: 0 })));
            const mockAccount: Account = { id: 'test-id', membershipState: MembershipState.MEMBER } as Account;
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));
            mockJwtHelperService.decodeToken.mockReturnValue({
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': []
            });

            await service.refresh();

            expect(mockSessionService.removeTokens).not.toHaveBeenCalled();
            expect(mockRouter.navigate).not.toHaveBeenCalled();
            expect(mockAccountService.getAccount).toHaveBeenCalled();
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('MEMBER');
        });

        it('navigates to login on 401 during account fetch', async () => {
            mockSessionService.hasStorageToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            mockAccountService.getAccount.mockReturnValue(throwError(() => ({ status: 401 })));

            await service.refresh();

            expect(mockSessionService.removeTokens).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        });

        it('tolerates transient errors during account fetch', async () => {
            mockSessionService.hasStorageToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            mockAccountService.getAccount.mockReturnValue(throwError(() => ({ status: 0 })));

            await service.refresh();

            expect(mockSessionService.removeTokens).not.toHaveBeenCalled();
            expect(mockRouter.navigate).not.toHaveBeenCalled();
        });

        it('sets unlogged when getAccount returns null', async () => {
            mockSessionService.hasStorageToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            mockAccountService.getAccount.mockReturnValue(null);

            await service.refresh();

            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('UNLOGGED');
        });

        it('does not run concurrently', async () => {
            mockSessionService.hasStorageToken.mockReturnValue(true);
            mockAuthenticationService.refresh.mockReturnValue(of({ token: 'new-token' }));
            const mockAccount: Account = { id: 'test-id', membershipState: MembershipState.MEMBER } as Account;
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));
            mockJwtHelperService.decodeToken.mockReturnValue({
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': []
            });

            const promise1 = service.refresh();
            const promise2 = service.refresh();

            await Promise.all([promise1, promise2]);

            expect(mockAuthenticationService.refresh).toHaveBeenCalledTimes(1);
        });
    });
});
