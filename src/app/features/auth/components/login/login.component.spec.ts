import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { RedirectService } from '@app/core/services/authentication/redirect.service';
import { PasskeyService } from '@app/core/services/authentication/passkey.service';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let mockAuth: any;
    let mockRouter: any;
    let mockPermissionsService: any;
    let mockRedirectService: any;
    let mockPasskeyService: any;

    beforeEach(() => {
        mockAuth = {
            login: vi.fn(),
            loginWithPasskey: vi.fn(),
            logout: vi.fn()
        };
        mockPasskeyService = {
            supported: true,
            conditionalMediationAvailable: vi.fn().mockResolvedValue(false),
            getAssertion: vi.fn()
        };
        mockRouter = {
            navigate: vi.fn().mockResolvedValue(true),
            navigateByUrl: vi.fn().mockResolvedValue(true)
        };
        mockPermissionsService = {
            refresh: vi.fn().mockResolvedValue(undefined)
        };
        mockRedirectService = {
            getAndClearRedirectUrl: vi.fn().mockReturnValue(null),
            setRedirectUrl: vi.fn(),
            clearRedirectUrl: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                LoginComponent,
                { provide: AuthenticationService, useValue: mockAuth },
                { provide: Router, useValue: mockRouter },
                { provide: PermissionsService, useValue: mockPermissionsService },
                { provide: RedirectService, useValue: mockRedirectService },
                { provide: PasskeyService, useValue: mockPasskeyService },
            ]
        });
        component = TestBed.inject(LoginComponent);
        // Mock the form ViewChild
        (component as any).form = { valid: true };
    });

    describe('ngOnInit', () => {
        it('clears any existing session on init', () => {
            component.ngOnInit();

            expect(mockAuth.logout).toHaveBeenCalled();
        });
    });

    describe('submit', () => {
        it('does nothing when honeypot field is filled', () => {
            component.model.name = 'bot';

            component.submit();

            expect(mockAuth.login).not.toHaveBeenCalled();
        });

        it('does nothing when form is invalid', () => {
            (component as any).form = { valid: false };

            component.submit();

            expect(mockAuth.login).not.toHaveBeenCalled();
        });

        it('does nothing when already pending', () => {
            component.pending = true;

            component.submit();

            expect(mockAuth.login).not.toHaveBeenCalled();
        });

        it('navigates to stored redirect URL after successful login', async () => {
            mockAuth.login.mockReturnValue(of({ token: 'test' }));
            mockRedirectService.getAndClearRedirectUrl.mockReturnValue('/admin');
            component.model.email = 'test@test.com';
            component.model.password = 'password';

            component.submit();

            // Wait for the refresh promise
            await mockPermissionsService.refresh();

            expect(mockRedirectService.getAndClearRedirectUrl).toHaveBeenCalled();
            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/admin');
        });

        it('navigates to /home when no redirect URL is stored', async () => {
            mockAuth.login.mockReturnValue(of({ token: 'test' }));
            mockRedirectService.getAndClearRedirectUrl.mockReturnValue(null);
            component.model.email = 'test@test.com';
            component.model.password = 'password';

            component.submit();

            await mockPermissionsService.refresh();

            expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home');
        });

        it('clears pending and shows error when refresh rejects', async () => {
            mockAuth.login.mockReturnValue(of({ token: 'test' }));
            mockPermissionsService.refresh.mockRejectedValue(new Error('refresh failed'));
            component.model.email = 'test@test.com';
            component.model.password = 'password';

            component.submit();

            await vi.waitFor(() => {
                expect(component.pending).toBe(false);
            });

            expect(component.loginError).toBe('Sign-in failed');
            expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
        });

        it('shows login error on failure', () => {
            mockAuth.login.mockReturnValue(throwError(() => ({ error: 'Invalid credentials' })));
            component.model.email = 'test@test.com';
            component.model.password = 'password';

            component.submit();

            expect(component.pending).toBe(false);
            expect(component.loginError).toBe('Invalid credentials');
        });
    });

    describe('passkeys', () => {
        const passkey = { flowId: 'flow', credential: {} };

        it('signs in with a passkey from the button', async () => {
            mockPasskeyService.getAssertion.mockResolvedValue(passkey);
            mockAuth.loginWithPasskey.mockReturnValue(of({ token: 'test' }));

            await component.loginWithPasskey();
            await vi.waitFor(() => expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/home'));

            expect(mockPasskeyService.getAssertion).toHaveBeenCalledWith();
            expect(mockAuth.loginWithPasskey).toHaveBeenCalledWith(passkey, true);
        });

        it('shows no error when the passkey prompt is cancelled', async () => {
            mockPasskeyService.getAssertion.mockRejectedValue(new DOMException('cancelled', 'NotAllowedError'));

            await component.loginWithPasskey();

            expect(component.passkeyPending).toBe(false);
            expect(component.loginError).toBe('');
        });

        it('shows the API error when the passkey is rejected', async () => {
            mockPasskeyService.getAssertion.mockResolvedValue(passkey);
            mockAuth.loginWithPasskey.mockReturnValue(throwError(() => ({ error: 'This passkey is not registered with UKSF' })));

            await component.loginWithPasskey();

            expect(component.passkeyPending).toBe(false);
            expect(component.loginError).toBe('This passkey is not registered with UKSF');
        });

        it('offers passkeys in autofill when the browser supports it', async () => {
            mockPasskeyService.conditionalMediationAvailable.mockResolvedValue(true);
            mockPasskeyService.getAssertion.mockReturnValue(new Promise(() => {}));

            component.ngOnInit();

            await vi.waitFor(() => expect(mockPasskeyService.getAssertion).toHaveBeenCalledWith('conditional', expect.any(AbortSignal)));
            const signal: AbortSignal = mockPasskeyService.getAssertion.mock.calls[0][1];
            component.ngOnDestroy();
            expect(signal.aborted).toBe(true);
        });

        it('cancels the autofill request before opening the passkey prompt', async () => {
            mockPasskeyService.conditionalMediationAvailable.mockResolvedValue(true);
            mockPasskeyService.getAssertion.mockReturnValueOnce(new Promise(() => {})).mockRejectedValue(new DOMException('cancelled', 'NotAllowedError'));
            component.ngOnInit();
            await vi.waitFor(() => expect(mockPasskeyService.getAssertion).toHaveBeenCalledTimes(1));
            const signal: AbortSignal = mockPasskeyService.getAssertion.mock.calls[0][1];

            await component.loginWithPasskey();

            expect(signal.aborted).toBe(true);
        });

        it('stops the autofill request when signing in with a password', async () => {
            mockPasskeyService.conditionalMediationAvailable.mockResolvedValue(true);
            mockPasskeyService.getAssertion.mockReturnValue(new Promise(() => {}));
            mockAuth.login.mockReturnValue(of({ token: 'test' }));
            component.ngOnInit();
            await vi.waitFor(() => expect(mockPasskeyService.getAssertion).toHaveBeenCalledTimes(1));
            const signal: AbortSignal = mockPasskeyService.getAssertion.mock.calls[0][1];
            component.model.email = 'test@test.com';
            component.model.password = 'password';

            component.submit();

            expect(signal.aborted).toBe(true);
        });

        it('ignores a password submit while a passkey sign-in is running', () => {
            component.passkeyPending = true;
            component.model.email = 'test@test.com';
            component.model.password = 'password';

            component.submit();

            expect(mockAuth.login).not.toHaveBeenCalled();
        });

        it('does not start autofill once the page has closed', async () => {
            let available: (value: boolean) => void;
            mockPasskeyService.conditionalMediationAvailable.mockReturnValue(new Promise((resolve) => (available = resolve)));

            component.ngOnInit();
            component.ngOnDestroy();
            available(true);
            await Promise.resolve();
            await Promise.resolve();

            expect(mockPasskeyService.getAssertion).not.toHaveBeenCalled();
        });

        it('ignores an autofill result that arrives after the button took over', async () => {
            let resolveAutofill: (value: unknown) => void;
            mockPasskeyService.conditionalMediationAvailable.mockResolvedValue(true);
            mockPasskeyService.getAssertion
                .mockReturnValueOnce(new Promise((resolve) => (resolveAutofill = resolve)))
                .mockReturnValueOnce(new Promise(() => {}));
            component.ngOnInit();
            await vi.waitFor(() => expect(mockPasskeyService.getAssertion).toHaveBeenCalledTimes(1));

            component.loginWithPasskey();
            resolveAutofill({ flowId: 'autofill', credential: {} });
            await Promise.resolve();
            await Promise.resolve();

            expect(mockAuth.loginWithPasskey).not.toHaveBeenCalled();
        });
    });
});
