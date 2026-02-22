import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationDetailsComponent } from './application-details.component';
import { UntypedFormBuilder } from '@angular/forms';

describe('ApplicationDetailsComponent', () => {
    let component: ApplicationDetailsComponent;
    let mockDialog: any;

    beforeEach(() => {
        mockDialog = { open: vi.fn() };
        component = new ApplicationDetailsComponent(new UntypedFormBuilder(), mockDialog);
    });

    describe('updateCachedErrors', () => {
        it('should set cached error for armaExperience when required and touched', () => {
            const control = component.formGroup.get('armaExperience');
            control.markAsTouched();

            component.updateCachedErrors();

            expect(component.cachedErrors.armaExperience).toBe('Details about your Arma experience are required');
        });

        it('should set empty string when control is valid', () => {
            component.formGroup.get('armaExperience').setValue('some experience');

            component.updateCachedErrors();

            expect(component.cachedErrors.armaExperience).toBe('');
        });

        it('should set cached error for all three fields', () => {
            component.formGroup.get('armaExperience').markAsTouched();
            component.formGroup.get('unitsExperience').markAsTouched();
            component.formGroup.get('background').markAsTouched();

            component.updateCachedErrors();

            expect(component.cachedErrors.armaExperience).not.toBe('');
            expect(component.cachedErrors.unitsExperience).not.toBe('');
            expect(component.cachedErrors.background).not.toBe('');
        });
    });
});
