import { describe, it, expect } from 'vitest';
import { UntypedFormBuilder } from '@angular/forms';
import { buildDetailsFormGroup, extractRolePreferences } from './application-form.constants';

describe('Application Form Constants', () => {
    const fb = new UntypedFormBuilder();

    describe('buildDetailsFormGroup', () => {
        it('should create rolePreferences sub-group defaulting to false', () => {
            const formGroup = buildDetailsFormGroup(fb);
            const rolePrefs = formGroup.get('rolePreferences');
            expect(rolePrefs.get('NCO').value).toBe(false);
            expect(rolePrefs.get('Officer').value).toBe(false);
            expect(rolePrefs.get('Aviation').value).toBe(false);
            expect(rolePrefs.get('Medic').value).toBe(false);
        });

        it('should reject non-empty honeypot field', () => {
            const formGroup = buildDetailsFormGroup(fb);
            formGroup.get('name').setValue('bot');
            expect(formGroup.get('name').valid).toBe(false);
        });

        it('should be invalid until all required fields are filled', () => {
            const formGroup = buildDetailsFormGroup(fb);
            expect(formGroup.valid).toBe(false);

            formGroup.patchValue({
                armaExperience: 'x',
                unitsExperience: 'x',
                background: 'x',
                reference: 'Steam'
            });
            expect(formGroup.valid).toBe(true);
        });
    });

    describe('extractRolePreferences', () => {
        it('should extract selected preferences as string array', () => {
            const formGroup = buildDetailsFormGroup(fb);
            formGroup.get('rolePreferences').get('NCO').setValue(true);
            formGroup.get('rolePreferences').get('Aviation').setValue(true);

            const result = extractRolePreferences(formGroup);
            expect(result['rolePreferences']).toEqual(['NCO', 'Aviation']);
        });

        it('should return empty array when none selected', () => {
            const formGroup = buildDetailsFormGroup(fb);
            const result = extractRolePreferences(formGroup);
            expect(result['rolePreferences']).toEqual([]);
        });
    });
});
