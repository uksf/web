import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { RedirectService } from '@app/core/services/authentication/redirect.service';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let mockAuth: any;
    let mockRouter: any;
    let mockPermissionsService: any;
    let mockRedirectService: any;

    beforeEach(() => {
        mockAuth = {
            login: vi.fn()
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
            ]
        });
        component = TestBed.inject(LoginComponent);
        // Mock the form ViewChild
        (component as any).form = { valid: true };
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

            expect(component.loginError).toBe('Login failed');
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
});
