import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { PermissionsService } from './permissions.service';
import { Account, MembershipState } from '@app/shared/models/account';

describe('PermissionsService', () => {
    let service: PermissionsService;
    let mockNgxPermissionsService: any;
    let mockSessionService: any;
    let mockAccountService: any;
    let mockSignalrService: any;
    let mockHttpClient: any;
    let mockUrls: any;
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
            getSessionToken: vi.fn().mockReturnValue('mock-token')
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
            reconnectEvent: new EventEmitter(),
            dispose: vi.fn()
        };

        mockSignalrService = {
            connect: vi.fn().mockReturnValue(mockConnectionContainer)
        };

        mockHttpClient = {};
        mockUrls = { apiUrl: 'http://localhost:5500' };

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
            mockHttpClient,
            mockUrls,
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

            service.revoke('/home');

            expect(mockAuthenticationService.logout).toHaveBeenCalledWith('/home');
            expect(mockNgxPermissionsService.flushPermissions).toHaveBeenCalled();
            expect(mockNgxPermissionsService.addPermission).toHaveBeenCalledWith('UNLOGGED');
        });
    });
});
