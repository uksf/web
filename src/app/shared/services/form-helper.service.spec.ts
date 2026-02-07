import { describe, it, expect, vi } from 'vitest';
import { InstantErrorStateMatcher, ConfirmValidParentMatcher } from './form-helper.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';

describe('InstantErrorStateMatcher', () => {
    const matcher = new InstantErrorStateMatcher();

    it('should return false for null control', () => {
        expect(matcher.isErrorState(null, null)).toBe(false);
    });

    it('should return false for valid untouched control', () => {
        const control = new FormControl('value');
        expect(matcher.isErrorState(control, null)).toBe(false);
    });

    it('should return false for invalid but untouched and pristine control', () => {
        const control = new FormControl('', Validators.required);
        expect(matcher.isErrorState(control, null)).toBe(false);
    });

    it('should return true for invalid and dirty control', () => {
        const control = new FormControl('', Validators.required);
        control.markAsDirty();
        expect(matcher.isErrorState(control, null)).toBe(true);
    });

    it('should return true for invalid and touched control', () => {
        const control = new FormControl('', Validators.required);
        control.markAsTouched();
        expect(matcher.isErrorState(control, null)).toBe(true);
    });

    it('should return false for valid and dirty control', () => {
        const control = new FormControl('value', Validators.required);
        control.markAsDirty();
        expect(matcher.isErrorState(control, null)).toBe(false);
    });
});

describe('ConfirmValidParentMatcher', () => {
    const matcher = new ConfirmValidParentMatcher();

    it('should return false when parent is valid', () => {
        const group = new FormGroup({
            password: new FormControl('abc'),
            confirm: new FormControl('abc')
        });
        const control = group.controls.confirm;
        control.markAsDirty();
        expect(matcher.isErrorState(control, null)).toBe(false);
    });

    it('should return true when parent is invalid and control is dirty', () => {
        const group = new FormGroup({
            password: new FormControl('', Validators.required),
            confirm: new FormControl('')
        });
        const control = group.controls.confirm;
        control.markAsDirty();
        expect(matcher.isErrorState(control, null)).toBe(true);
    });

    it('should return false when parent is invalid but control is pristine and untouched', () => {
        const group = new FormGroup({
            password: new FormControl('', Validators.required),
            confirm: new FormControl('')
        });
        const control = group.controls.confirm;
        expect(matcher.isErrorState(control, null)).toBe(false);
    });
});
