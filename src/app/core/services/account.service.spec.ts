import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AccountService } from './account.service';
import { UrlService } from './url.service';
import { SessionService } from './authentication/session.service';
import { Account, MembershipState } from '@app/shared/models/account';

describe('AccountService', () => {
    let service: AccountService;
    let mockHttpClient: any;
    let mockUrls: any;
    let mockSessionService: any;
    let mockDialog: any;
    let checkConnectionsSpy: ReturnType<typeof vi.spyOn>;

    const mockAccount: Partial<Account> = {
        id: 'test-id',
        displayName: 'Test User',
        membershipState: MembershipState.MEMBER,
        teamspeakIdentities: [12345],
        steamname: 'teststeam',
        discordId: 'discord123'
    };

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn()
        };
        mockUrls = { apiUrl: 'http://localhost:5500' };
        mockSessionService = {
            hasStorageToken: vi.fn().mockReturnValue(true),
            hasToken: vi.fn().mockReturnValue(true)
        };
        mockDialog = {
            open: vi.fn(),
            openDialogs: []
        };

        TestBed.configureTestingModule({
            providers: [
                AccountService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: mockUrls },
                { provide: SessionService, useValue: mockSessionService },
                { provide: MatDialog, useValue: mockDialog },
            ]
        });
        service = TestBed.inject(AccountService);
        // Spy on checkConnections to avoid window.location access in Node
        checkConnectionsSpy = vi.spyOn(service, 'checkConnections').mockImplementation(() => {});
    });

    afterEach(() => {
        checkConnectionsSpy.mockRestore();
    });

    describe('getAccount', () => {
        it('returns an observable of the account from the API', () => {
            mockHttpClient.get.mockReturnValue(of(mockAccount));

            let result: Account | undefined;
            service.getAccount().subscribe({
                next: (account) => { result = account; }
            });

            expect(result).toEqual(mockAccount);
            expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/accounts');
        });

        it('sets the account property on success', () => {
            mockHttpClient.get.mockReturnValue(of(mockAccount));

            service.getAccount().subscribe();

            expect(service.account).toEqual(mockAccount);
        });

        it('emits on accountChange$ on success', () => {
            mockHttpClient.get.mockReturnValue(of(mockAccount));

            let emitted: Account | undefined;
            service.accountChange$.subscribe({
                next: (account) => { emitted = account; }
            });

            service.getAccount().subscribe();

            expect(emitted).toEqual(mockAccount);
        });

        it('does not call API when no token exists in either storage', () => {
            mockSessionService.hasToken.mockReturnValue(false);

            const result = service.getAccount();

            expect(result).toBeUndefined();
            expect(mockHttpClient.get).not.toHaveBeenCalled();
        });

        it('clears account on error', () => {
            service.account = mockAccount as Account;
            mockHttpClient.get.mockReturnValue(throwError(() => new Error('fail')));

            service.getAccount().subscribe({
                error: () => {}
            });

            expect(service.account).toBeUndefined();
        });
    });

    describe('clear', () => {
        it('sets account to undefined', () => {
            service.account = mockAccount as Account;

            service.clear();

            expect(service.account).toBeUndefined();
        });
    });
});
