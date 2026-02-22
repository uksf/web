import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationIdentityComponent } from './application-identity.component';
import { UntypedFormBuilder } from '@angular/forms';
import { of } from 'rxjs';

describe('ApplicationIdentityComponent', () => {
    let component: ApplicationIdentityComponent;
    let mockDialog: any;
    let mockApplicationService: any;
    let mockAuthService: any;
    let mockPermissionsService: any;

    beforeEach(() => {
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

        component = new ApplicationIdentityComponent(
            mockDialog,
            new UntypedFormBuilder(),
            mockApplicationService,
            mockAuthService,
            mockPermissionsService
        );
    });

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
});
