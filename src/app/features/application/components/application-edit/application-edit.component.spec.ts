import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationEditComponent } from './application-edit.component';
import { UntypedFormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { ApplicationState } from '@app/features/application/models/application';
import * as formConstants from '../../models/application-form.constants';

describe('ApplicationEditComponent', () => {
    let component: ApplicationEditComponent;
    let mockDialog: any;
    let mockApplicationService: any;
    let mockAccountService: any;
    let mockPermissions: any;
    let mockRouter: any;
    let accountUpdateEvent$: Subject<void>;

    const makeAccount = (overrides: Partial<any> = {}) => ({
        id: 'acc-1',
        firstname: 'John',
        lastname: 'Doe',
        armaExperience: 'Some experience',
        unitsExperience: 'Some units',
        background: 'Some background',
        militaryExperience: false,
        reference: 'Friend',
        rolePreferences: [],
        application: {
            state: ApplicationState.WAITING,
            applicationCommentThread: 'thread-1'
        },
        ...overrides
    });

    beforeEach(() => {
        accountUpdateEvent$ = new Subject<void>();
        mockDialog = { open: vi.fn().mockReturnValue({ afterClosed: () => of(undefined) }) };
        mockApplicationService = {
            updateApplication: vi.fn().mockReturnValue(of(undefined))
        };
        mockAccountService = {
            account: makeAccount(),
            getAccount: vi.fn().mockReturnValue(of(undefined))
        };
        mockPermissions = {
            hasPermission: vi.fn().mockReturnValue(false),
            accountUpdateEvent: accountUpdateEvent$.asObservable()
        };
        mockRouter = { navigate: vi.fn() };

        component = new ApplicationEditComponent(
            new UntypedFormBuilder(),
            mockDialog,
            mockApplicationService,
            mockAccountService,
            mockPermissions,
            mockRouter
        );
    });

    describe('changesMade caching', () => {
        it('should be false initially (form matches original)', () => {
            expect(component.changesMade).toBe(false);
        });

        it('should update to true when form value changes', () => {
            component.formGroup.controls['armaExperience'].setValue('Changed experience');

            expect(component.changesMade).toBe(true);
        });

        it('should return to false when form value matches original', () => {
            const originalValue = component.formGroup.controls['armaExperience'].value;
            component.formGroup.controls['armaExperience'].setValue('Changed');
            expect(component.changesMade).toBe(true);

            component.formGroup.controls['armaExperience'].setValue(originalValue);
            expect(component.changesMade).toBe(false);
        });

        it('should not recompute on repeated access without form changes', () => {
            const spy = vi.spyOn(formConstants, 'extractRolePreferences');
            spy.mockClear();

            // Access changesMade multiple times
            const _r1 = component.changesMade;
            const _r2 = component.changesMade;
            const _r3 = component.changesMade;

            // extractRolePreferences should not be called on each access (it's cached)
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('applicationState', () => {
        it('returns "Application Accepted" for accepted state', () => {
            mockAccountService.account = makeAccount({
                application: { state: ApplicationState.ACCEPTED, applicationCommentThread: '' }
            });

            expect(component.applicationState).toBe('Application Accepted');
        });

        it('returns "Application Rejected" for rejected state', () => {
            mockAccountService.account = makeAccount({
                application: { state: ApplicationState.REJECTED, applicationCommentThread: '' }
            });

            expect(component.applicationState).toBe('Application Rejected');
        });

        it('returns "Application Submitted" for waiting state', () => {
            expect(component.applicationState).toBe('Application Submitted');
        });
    });

    describe('update', () => {
        it('does nothing if honeypot field is filled', () => {
            component.formGroup.controls['name'].setValue('spam');

            component.update();

            expect(mockApplicationService.updateApplication).not.toHaveBeenCalled();
        });

        it('submits application update', () => {
            component.update();

            expect(mockApplicationService.updateApplication).toHaveBeenCalledWith('acc-1', expect.any(String));
        });
    });

    describe('updateCachedErrors', () => {
        it('should set cached error when control is required and touched', () => {
            component.formGroup.get('armaExperience').setValue('');
            component.formGroup.get('armaExperience').markAsTouched();

            component.updateCachedErrors();

            expect(component.cachedErrors.armaExperience).toBe('Details about your Arma experience are required');
        });

        it('should set empty string when control is valid', () => {
            component.formGroup.get('armaExperience').setValue('some experience');

            component.updateCachedErrors();

            expect(component.cachedErrors.armaExperience).toBe('');
        });
    });

    describe('name', () => {
        it('formats name correctly', () => {
            expect(component.name).toBe('Cdt.Doe.J');
        });
    });
});
