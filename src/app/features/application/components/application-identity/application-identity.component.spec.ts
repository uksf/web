import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ApplicationIdentityComponent } from './application-identity.component';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ApplicationService } from '../../services/application.service';
import { AuthenticationService } from '@app/core/services/authentication/authentication.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { PasskeyService } from '@app/core/services/authentication/passkey.service';

describe('ApplicationIdentityComponent', () => {
    let component: ApplicationIdentityComponent;
    let mockDialog: any;
    let mockApplicationService: any;
    let mockAuthService: any;
    let mockPermissionsService: any;
    let mockPasskeyService: any;

    function configure(passkeysSupported: boolean) {
        mockDialog = { open: vi.fn() };
        mockApplicationService = {
            getNations: vi.fn().mockReturnValue(of([])),
            checkEmailExists: vi.fn().mockReturnValue(of(false))
        };
        mockAuthService = {
            createAccount: vi.fn().mockReturnValue(of(undefined))
        };
        mockPermissionsService = {
            refresh: vi.fn().mockResolvedValue(undefined)
        };
        mockPasskeyService = {
            supported: passkeysSupported,
            createForNewAccount: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                ApplicationIdentityComponent,
                UntypedFormBuilder,
                { provide: MatDialog, useValue: mockDialog },
                { provide: ApplicationService, useValue: mockApplicationService },
                { provide: AuthenticationService, useValue: mockAuthService },
                { provide: PermissionsService, useValue: mockPermissionsService },
                { provide: PasskeyService, useValue: mockPasskeyService },
            ]
        });
        component = TestBed.inject(ApplicationIdentityComponent);
    }

    function fillIdentity() {
        component.formGroup.patchValue({
            email: 'test@test.com',
            firstName: 'Test',
            lastName: 'User',
            dobGroup: { day: '15', month: '2', year: '1989' },
            nation: { value: 'GB' }
        });
    }

    beforeEach(() => configure(true));

    describe('cachedDobError', () => {
        it('should be empty string initially', () => {
            expect(component.cachedDobError).toBe('');
        });

        it('should update when DOB group has error and is touched', () => {
            const dobGroup = component.formGroup.get('dobGroup');
            dobGroup.get('day').setValue('32');
            dobGroup.get('month').setValue('13');
            dobGroup.get('year').setValue('abc');
            dobGroup.markAllAsTouched();

            component.updateCachedDobError();

            expect(component.cachedDobError).not.toBe('');
        });

        it('should be empty when DOB group is valid', () => {
            const dobGroup = component.formGroup.get('dobGroup');
            dobGroup.get('day').setValue('15');
            dobGroup.get('month').setValue('2');
            dobGroup.get('year').setValue('1989');

            component.updateCachedDobError();

            expect(component.cachedDobError).toBe('');
        });
    });

    describe('sign-in method', () => {
        const passkey = { flowId: 'flow', credential: {} };

        it('defaults to a passkey and ignores the password fields', () => {
            expect(component.usePasskey).toBe(true);
            expect(component.formGroup.get('passwordGroup').disabled).toBe(true);
        });

        it('defaults to a password when the browser has no passkey support', () => {
            TestBed.resetTestingModule();
            configure(false);

            expect(component.usePasskey).toBe(false);
            expect(component.formGroup.get('passwordGroup').enabled).toBe(true);
        });

        it('creates the account with a passkey', async () => {
            mockPasskeyService.createForNewAccount.mockResolvedValue(passkey);
            fillIdentity();

            component.next();
            await vi.waitFor(() => expect(mockAuthService.createAccount).toHaveBeenCalled());

            expect(mockPasskeyService.createForNewAccount).toHaveBeenCalledWith({ email: 'test@test.com', firstName: 'Test', lastName: 'User' });
            const body = mockAuthService.createAccount.mock.calls[0][0];
            expect(body.passkey).toEqual(passkey);
            expect(body.password).toBeUndefined();
        });

        it('creates the account with a password', () => {
            component.setUsePasskey(false);
            fillIdentity();
            component.formGroup.patchValue({ passwordGroup: { password: 'a-long-password', confirmPassword: 'a-long-password' } });

            component.next();

            expect(mockPasskeyService.createForNewAccount).not.toHaveBeenCalled();
            const body = mockAuthService.createAccount.mock.calls[0][0];
            expect(body.password).toBe('a-long-password');
            expect(body.passkey).toBeUndefined();
        });

        it('stays on the step without an error when the passkey prompt is cancelled', async () => {
            mockPasskeyService.createForNewAccount.mockRejectedValue(new DOMException('cancelled', 'NotAllowedError'));
            fillIdentity();

            component.next();
            await vi.waitFor(() => expect(component.pending).toBe(false));

            expect(mockAuthService.createAccount).not.toHaveBeenCalled();
            expect(mockDialog.open).not.toHaveBeenCalled();
        });
    });
});
