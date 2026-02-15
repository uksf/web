import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { AuthenticationService, TokenResponse } from './authentication.service';

describe('AuthenticationService', () => {
    let service: AuthenticationService;
    let mockHttpClient: any;
    let mockRouter: any;
    let mockUrls: any;
    let mockSessionService: any;
    let mockAccountService: any;
    let mockJwtHelperService: any;

    const mockTokenResponse: TokenResponse = { token: 'mock-jwt-token' };

    beforeEach(() => {
        mockHttpClient = {
            post: vi.fn(),
            get: vi.fn()
        };
        mockRouter = {
            navigate: vi.fn().mockResolvedValue(true)
        };
        mockUrls = { apiUrl: 'http://localhost:5500' };
        mockSessionService = {
            setSessionToken: vi.fn(),
            setStorageToken: vi.fn(),
            hasStorageToken: vi.fn().mockReturnValue(true),
            removeTokens: vi.fn(),
            getSessionToken: vi.fn().mockReturnValue('mock-token')
        };
        mockAccountService = {
            clear: vi.fn()
        };
        mockJwtHelperService = {
            decodeToken: vi.fn().mockReturnValue({})
        };

        service = new AuthenticationService(
            mockHttpClient,
            mockRouter,
            mockUrls,
            mockSessionService,
            mockAccountService,
            mockJwtHelperService
        );
    });

    describe('login', () => {
        it('returns an observable that sets session token on success', () => {
            mockHttpClient.post.mockReturnValue(of(mockTokenResponse));

            let completed = false;
            service.login('test@test.com', 'password', false).subscribe({
                next: () => { completed = true; }
            });

            expect(completed).toBe(true);
            expect(mockSessionService.setSessionToken).toHaveBeenCalledWith('mock-jwt-token');
            expect(mockHttpClient.post).toHaveBeenCalledWith(
                'http://localhost:5500/auth/login',
                { email: 'test@test.com', password: 'password' }
            );
        });

        it('sets storage token when stayLogged is true', () => {
            mockHttpClient.post.mockReturnValue(of(mockTokenResponse));

            service.login('test@test.com', 'password', true).subscribe();

            expect(mockSessionService.setStorageToken).toHaveBeenCalled();
        });

        it('does not set storage token when stayLogged is false', () => {
            mockHttpClient.post.mockReturnValue(of(mockTokenResponse));

            service.login('test@test.com', 'password', false).subscribe();

            expect(mockSessionService.setStorageToken).not.toHaveBeenCalled();
        });

        it('propagates errors', () => {
            const error = { error: 'Invalid credentials' };
            mockHttpClient.post.mockReturnValue(throwError(() => error));

            let receivedError: any;
            service.login('test@test.com', 'password', false).subscribe({
                error: (err) => { receivedError = err; }
            });

            expect(receivedError).toBe(error);
        });
    });

    describe('refresh', () => {
        it('refreshes the token and persists to localStorage when storage token exists', () => {
            mockHttpClient.get.mockReturnValue(of(mockTokenResponse));
            mockSessionService.hasStorageToken.mockReturnValue(true);

            let completed = false;
            service.refresh().subscribe({
                next: () => { completed = true; }
            });

            expect(completed).toBe(true);
            expect(mockSessionService.setSessionToken).toHaveBeenCalledWith('mock-jwt-token');
            expect(mockSessionService.setStorageToken).toHaveBeenCalled();
        });

        it('refreshes the token without persisting to localStorage when no storage token', () => {
            mockHttpClient.get.mockReturnValue(of(mockTokenResponse));
            mockSessionService.hasStorageToken.mockReturnValue(false);

            let completed = false;
            service.refresh().subscribe({
                next: () => { completed = true; }
            });

            expect(completed).toBe(true);
            expect(mockSessionService.setSessionToken).toHaveBeenCalledWith('mock-jwt-token');
            expect(mockSessionService.setStorageToken).not.toHaveBeenCalled();
        });

        it('propagates errors', () => {
            const error = { error: 'Token expired' };
            mockHttpClient.get.mockReturnValue(throwError(() => error));

            let receivedError: any;
            service.refresh().subscribe({
                error: (err) => { receivedError = err; }
            });

            expect(receivedError).toBe(error);
        });
    });

    describe('requestPasswordReset', () => {
        it('returns an observable that posts to password reset endpoint', () => {
            mockHttpClient.post.mockReturnValue(of(null));

            let completed = false;
            service.requestPasswordReset('test@test.com').subscribe({
                next: () => { completed = true; }
            });

            expect(completed).toBe(true);
            expect(mockHttpClient.post).toHaveBeenCalledWith(
                'http://localhost:5500/auth/passwordReset',
                { email: 'test@test.com' }
            );
        });
    });

    describe('passwordReset', () => {
        it('returns an observable that sets session token on success', () => {
            mockHttpClient.post.mockReturnValue(of(mockTokenResponse));

            let completed = false;
            service.passwordReset('test@test.com', 'newpass', 'reset-code', true).subscribe({
                next: () => { completed = true; }
            });

            expect(completed).toBe(true);
            expect(mockSessionService.setSessionToken).toHaveBeenCalledWith('mock-jwt-token');
            expect(mockSessionService.setStorageToken).toHaveBeenCalled();
        });
    });

    describe('createAccount', () => {
        it('returns an observable that sets session token on success', () => {
            mockHttpClient.post.mockReturnValue(of(mockTokenResponse));

            let completed = false;
            service.createAccount({ email: 'test@test.com' } as any).subscribe({
                next: () => { completed = true; }
            });

            expect(completed).toBe(true);
            expect(mockSessionService.setSessionToken).toHaveBeenCalledWith('mock-jwt-token');
        });
    });

    describe('impersonate', () => {
        it('returns an observable that sets impersonated token', () => {
            mockHttpClient.get.mockReturnValue(of(mockTokenResponse));

            let completed = false;
            service.impersonate('account-123').subscribe({
                next: () => { completed = true; }
            });

            expect(completed).toBe(true);
            expect(mockSessionService.setSessionToken).toHaveBeenCalledWith('mock-jwt-token');
            expect(mockSessionService.setStorageToken).toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('removes tokens, clears account, and navigates to login', () => {
            service.logout();

            expect(mockSessionService.removeTokens).toHaveBeenCalled();
            expect(mockAccountService.clear).toHaveBeenCalled();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        });
    });

    describe('isImpersonated', () => {
        it('returns true when impersonator claim exists', () => {
            mockJwtHelperService.decodeToken.mockReturnValue({ impersonator: 'some-user-id' });

            expect(service.isImpersonated()).toBe(true);
        });

        it('returns false when no impersonator claim', () => {
            mockJwtHelperService.decodeToken.mockReturnValue({});

            expect(service.isImpersonated()).toBe(false);
        });
    });
});
