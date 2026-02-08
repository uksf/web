import { describe, it, expect, beforeEach } from 'vitest';
import { MustSelectFromDropdownValidatorDirective } from './dropdown-validator.directive';
import { FormControl } from '@angular/forms';

describe('MustSelectFromDropdownValidatorDirective', () => {
    let directive: MustSelectFromDropdownValidatorDirective;

    beforeEach(() => {
        directive = new MustSelectFromDropdownValidatorDirective();
        directive.elements = [
            { value: '1', displayValue: 'Alpha' },
            { value: '2', displayValue: 'Bravo' },
            { value: '3', displayValue: 'Charlie' }
        ];
        directive.elementMatcher = (element, match) => element.displayValue.toLowerCase() === match;
        directive.elementDisplayWith = (element) => element.displayValue;
    });

    it('should return null for empty control', () => {
        const control = new FormControl('');
        expect(directive.validate(control)).toBeNull();
    });

    it('should return null for null control', () => {
        expect(directive.validate(null)).toBeNull();
    });

    it('should return null when string value matches an element', () => {
        const control = new FormControl('Alpha');
        expect(directive.validate(control)).toBeNull();
    });

    it('should return { invalid: true } when string value does not match any element', () => {
        const control = new FormControl('Delta');
        expect(directive.validate(control)).toEqual({ invalid: true });
    });

    it('should return null when object value matches an element', () => {
        const control = new FormControl({ value: '1', displayValue: 'Alpha' });
        expect(directive.validate(control)).toBeNull();
    });

    it('should return { invalid: true } when object value does not match', () => {
        const control = new FormControl({ value: '4', displayValue: 'Delta' });
        expect(directive.validate(control)).toEqual({ invalid: true });
    });
});
