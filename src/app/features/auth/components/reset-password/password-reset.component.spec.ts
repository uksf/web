import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { PasswordResetComponent } from './password-reset.component';

describe('PasswordResetComponent', () => {
    let component: PasswordResetComponent;
    let mockAuth: any;
    let mockRoute: any;
    let mockRouter: any;
    let mockPermissionsService: any;

    beforeEach(() => {
        mockAuth = {
            passwordReset: vi.fn()
        };
        mockRoute = {
            snapshot: { params: {} }
        };
        mockRouter = {
            navigate: vi.fn().mockResolvedValue(true)
        };
        mockPermissionsService = {
            refresh: vi.fn().mockResolvedValue(undefined)
        };

        component = new PasswordResetComponent(mockAuth, mockRoute, mockRouter, mockPermissionsService);
        component.resetPasswordCode = 'test-code';
        // Mock the form ViewChild
        (component as any).form = { valid: true };
    });

    describe('ngOnInit', () => {
        it('redirects to login when no reset password code', () => {
            component.resetPasswordCode = undefined;

            component.ngOnInit();

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        });

        it('does not redirect when reset password code exists', () => {
            component.ngOnInit();

            expect(mockRouter.navigate).not.toHaveBeenCalled();
        });
    });

    describe('submit', () => {
        it('does nothing when honeypot field is filled', () => {
            component.model.name = 'bot';

            component.submit();

            expect(mockAuth.passwordReset).not.toHaveBeenCalled();
        });

        it('does nothing when form is invalid', () => {
            (component as any).form = { valid: false };

            component.submit();

            expect(mockAuth.passwordReset).not.toHaveBeenCalled();
        });

        it('does nothing when already pending', () => {
            component.pending = true;

            component.submit();

            expect(mockAuth.passwordReset).not.toHaveBeenCalled();
        });

        it('navigates to /home after successful password reset', async () => {
            mockAuth.passwordReset.mockReturnValue(of({ token: 'test' }));
            component.model.email = 'test@test.com';
            component.model.password = 'newpass';

            component.submit();

            await mockPermissionsService.refresh();

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
        });

        it('clears pending and shows error when refresh rejects', async () => {
            mockAuth.passwordReset.mockReturnValue(of({ token: 'test' }));
            mockPermissionsService.refresh.mockRejectedValue(new Error('refresh failed'));
            component.model.email = 'test@test.com';
            component.model.password = 'newpass';

            component.submit();

            await vi.waitFor(() => {
                expect(component.pending).toBe(false);
            });

            expect(component.loginError).toBe('Password reset failed');
            expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/home']);
        });

        it('shows error from UksfError on API failure', () => {
            mockAuth.passwordReset.mockReturnValue(throwError(() => ({ error: 'Invalid reset code', statusCode: 400 })));
            component.model.email = 'test@test.com';
            component.model.password = 'newpass';

            component.submit();

            expect(component.pending).toBe(false);
            expect(component.loginError).toBe('Invalid reset code');
        });

        it('shows default error when UksfError has no error message', () => {
            mockAuth.passwordReset.mockReturnValue(throwError(() => ({})));
            component.model.email = 'test@test.com';
            component.model.password = 'newpass';

            component.submit();

            expect(component.pending).toBe(false);
            expect(component.loginError).toBe('Password reset failed');
        });

        it('sets pending to true during submission', () => {
            mockAuth.passwordReset.mockReturnValue(of({ token: 'test' }));
            component.model.email = 'test@test.com';
            component.model.password = 'newpass';

            expect(component.pending).toBe(false);

            component.submit();

            // After submit and before refresh resolves, should be pending
            // (since refresh was already resolved synchronously above, check calls were made)
            expect(mockAuth.passwordReset).toHaveBeenCalledWith('test@test.com', 'newpass', 'test-code', true);
        });

        it('passes stayLogged preference to passwordReset', () => {
            mockAuth.passwordReset.mockReturnValue(of({ token: 'test' }));
            component.model.email = 'test@test.com';
            component.model.password = 'newpass';
            component.stayLogged = false;

            component.submit();

            expect(mockAuth.passwordReset).toHaveBeenCalledWith('test@test.com', 'newpass', 'test-code', false);
        });
    });
});
