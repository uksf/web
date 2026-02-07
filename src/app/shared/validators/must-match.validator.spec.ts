import { describe, it, expect } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { MustMatch } from './must-match.validator';

describe('MustMatch validator', () => {
    const fb = new FormBuilder();

    it('should set mustMatch error when controls do not match', () => {
        const group = fb.group(
            {
                password: ['abc'],
                confirm: ['xyz']
            },
            { validators: MustMatch('password', 'confirm') }
        );

        group.updateValueAndValidity();
        expect(group.controls.confirm.hasError('mustMatch')).toBe(true);
    });

    it('should clear errors when controls match', () => {
        const group = fb.group(
            {
                password: ['abc'],
                confirm: ['abc']
            },
            { validators: MustMatch('password', 'confirm') }
        );

        group.updateValueAndValidity();
        expect(group.controls.confirm.hasError('mustMatch')).toBe(false);
        expect(group.controls.confirm.errors).toBeNull();
    });

    it('should not interfere with other errors on the matching control', () => {
        const group = fb.group(
            {
                password: ['abc'],
                confirm: ['xyz']
            },
            { validators: MustMatch('password', 'confirm') }
        );

        group.controls.confirm.setErrors({ someOtherError: true });
        group.updateValueAndValidity();

        // Should preserve the other error and not set mustMatch
        expect(group.controls.confirm.hasError('someOtherError')).toBe(true);
    });

    it('should return null if control names do not exist', () => {
        const group = fb.group(
            {
                password: ['abc']
            },
            { validators: MustMatch('password', 'nonexistent') }
        );

        // Should not throw
        group.updateValueAndValidity();
    });

    it('should handle empty values', () => {
        const group = fb.group(
            {
                password: [''],
                confirm: ['']
            },
            { validators: MustMatch('password', 'confirm') }
        );

        group.updateValueAndValidity();
        expect(group.controls.confirm.errors).toBeNull();
    });

    it('should update when values change to match', () => {
        const group = fb.group(
            {
                password: ['abc'],
                confirm: ['xyz']
            },
            { validators: MustMatch('password', 'confirm') }
        );

        group.updateValueAndValidity();
        expect(group.controls.confirm.hasError('mustMatch')).toBe(true);

        group.controls.confirm.setValue('abc');
        group.updateValueAndValidity();
        expect(group.controls.confirm.errors).toBeNull();
    });

    it('should update when values change to not match', () => {
        const group = fb.group(
            {
                password: ['abc'],
                confirm: ['abc']
            },
            { validators: MustMatch('password', 'confirm') }
        );

        group.updateValueAndValidity();
        expect(group.controls.confirm.errors).toBeNull();

        group.controls.password.setValue('changed');
        group.updateValueAndValidity();
        expect(group.controls.confirm.hasError('mustMatch')).toBe(true);
    });
});
