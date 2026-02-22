import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { SelectionListComponent, SelectionListValidator } from './selection-list.component';
import { IDropdownElement } from '../dropdown-base/dropdown-base.component';
import { UntypedFormControl } from '@angular/forms';

describe('SelectionListComponent', () => {
    let component: SelectionListComponent;

    const elements: IDropdownElement[] = [
        { value: '1', displayValue: 'Alpha' },
        { value: '2', displayValue: 'Bravo' },
        { value: '3', displayValue: 'Charlie' }
    ];

    afterEach(() => {
        delete (globalThis as any).window;
    });

    beforeEach(() => {
        (globalThis as any).window = { innerHeight: 1024 };

        component = new SelectionListComponent();
        component.elements = of(elements);
        component.elementName = 'role';
        component.placeholder = 'Select role';
        component.textInputElement = { nativeElement: { blur: vi.fn() } } as any;
    });

    describe('defaults', () => {
        it('should have empty list model', () => {
            expect(component.listModel).toEqual([]);
        });

        it('should have form with textInput and list controls', () => {
            expect(component.form.get('textInput')).toBeDefined();
            expect(component.form.get('list')).toBeDefined();
        });

        it('should default listPosition to top', () => {
            expect(component.listPosition).toBe('top');
        });
    });

    describe('focus/blur state', () => {
        it('should set focused to true on input focus', () => {
            component.onInputFocus();
            expect(component.focused).toBe(true);
        });

        it('should set focused to false on input blur', () => {
            component.onInputFocus();
            component.onInputBlur();
            expect(component.focused).toBe(false);
        });

    });

    describe('labelFloating', () => {
        it('should not float when empty and unfocused', () => {
            expect(component.labelFloating).toBe(false);
        });

        it('should float when focused', () => {
            component.onInputFocus();
            expect(component.labelFloating).toBe(true);
        });

        it('should float when textModel has value', () => {
            component.textModel = 'Alpha';
            expect(component.labelFloating).toBe(true);
        });
    });

    describe('listModel setter', () => {
        it('should update form list control value', () => {
            component.listModel = [elements[0]];
            expect(component.form.get('list').value).toEqual([elements[0]]);
        });

        it('should mark textInput as touched when list has items', () => {
            component.listModel = [elements[0]];
            expect(component.form.get('textInput').touched).toBe(true);
        });

        it('should not mark textInput as touched when list is set to empty', () => {
            component.listModel = [];
            expect(component.form.get('textInput').touched).toBe(false);
        });

        it('should call onListChange callback', () => {
            const fn = vi.fn();
            component.registerOnChange(fn);
            component.listModel = [elements[0]];
            expect(fn).toHaveBeenCalledWith([elements[0]]);
        });
    });

    describe('onSelect', () => {
        it('should add selected element to list', () => {
            component.ngOnInit();
            component.onSelect({ option: { value: elements[0] } } as any);
            expect(component.listModel).toEqual([elements[0]]);
        });

        it('should not add duplicate element', () => {
            component.ngOnInit();
            component.onSelect({ option: { value: elements[0] } } as any);
            component.onSelect({ option: { value: elements[0] } } as any);
            expect(component.listModel).toEqual([elements[0]]);
        });

        it('should not add null model', () => {
            component.ngOnInit();
            component.onSelect({ option: { value: null } } as any);
            expect(component.listModel).toEqual([]);
        });

        it('should add multiple different elements', () => {
            component.ngOnInit();
            component.onSelect({ option: { value: elements[0] } } as any);
            component.onSelect({ option: { value: elements[1] } } as any);
            expect(component.listModel).toEqual([elements[0], elements[1]]);
        });
    });

    describe('remove', () => {
        it('should remove element from list', () => {
            component.listModel = [elements[0], elements[1]];
            component.remove(elements[0]);
            expect(component.listModel).toEqual([elements[1]]);
        });

        it('should result in empty list when removing last element', () => {
            component.listModel = [elements[0]];
            component.remove(elements[0]);
            expect(component.listModel).toEqual([]);
        });

        it('should mark textInput as touched when removing an element', () => {
            component.listModel = [elements[0]];
            component.form.get('textInput').markAsUntouched();
            component.remove(elements[0]);
            expect(component.form.get('textInput').touched).toBe(true);
        });
    });

    describe('getDisabled', () => {
        it('should return true for elements in list', () => {
            component.listModel = [elements[0]];
            expect(component.getDisabled(elements[0])).toBe(true);
        });

        it('should return false for elements not in list', () => {
            component.listModel = [elements[0]];
            expect(component.getDisabled(elements[1])).toBe(false);
        });
    });

    describe('CVA: writeValue', () => {
        it('should set listModel when value provided', () => {
            component.writeValue([elements[0], elements[1]]);
            expect(component.listModel).toEqual([elements[0], elements[1]]);
        });

        it('should ignore null value', () => {
            component.writeValue(null);
            expect(component.listModel).toEqual([]);
        });
    });

    describe('CVA: registerOnChange', () => {
        it('should store the onChange callback', () => {
            const fn = vi.fn();
            component.registerOnChange(fn);
            component.listModel = [elements[0]];
            expect(fn).toHaveBeenCalledWith([elements[0]]);
        });
    });

    describe('hasListError / listErrorMessage', () => {
        it('should have no error when textInput is untouched', () => {
            expect(component.hasListError).toBe(false);
            expect(component.listErrorMessage).toBe('');
        });

        it('should have no error when textInput is touched and list is valid', () => {
            component.form.get('textInput').markAsTouched();
            component.listModel = [elements[0]];
            expect(component.hasListError).toBe(false);
        });

        it('should show required error when required, touched, and list is empty', () => {
            component.required = true;
            component.ngOnChanges({ required: { currentValue: true } } as any);
            component.form.get('textInput').markAsTouched();
            expect(component.hasListError).toBe(true);
            expect(component.listErrorMessage).toBe('At least one role is required');
        });

        it('should clear required error when item is added', () => {
            component.required = true;
            component.ngOnChanges({ required: { currentValue: true } } as any);
            component.form.get('textInput').markAsTouched();
            expect(component.hasListError).toBe(true);

            component.listModel = [elements[0]];
            expect(component.hasListError).toBe(false);
        });

        it('should show required error when last item is removed', () => {
            component.required = true;
            component.ngOnChanges({ required: { currentValue: true } } as any);
            component.listModel = [elements[0]];
            expect(component.hasListError).toBe(false);

            component.remove(elements[0]);
            expect(component.hasListError).toBe(true);
            expect(component.listErrorMessage).toBe('At least one role is required');
        });

        it('should not show required error when not required and list is empty', () => {
            component.form.get('textInput').markAsTouched();
            expect(component.hasListError).toBe(false);
        });
    });

    describe('validate', () => {
        it('should return null when list has items', () => {
            component.listModel = [elements[0]];
            expect(component.validate(null)).toBeNull();
        });

        it('should return null for empty list when not required', () => {
            expect(component.validate(null)).toBeNull();
        });

        it('should return noneSelected for empty list when required', () => {
            component.required = true;
            component.ngOnChanges({ required: { currentValue: true } } as any);
            expect(component.validate(null)).toEqual({ noneSelected: true });
        });

        it('should return null when required and list has items', () => {
            component.required = true;
            component.ngOnChanges({ required: { currentValue: true } } as any);
            component.listModel = [elements[0]];
            expect(component.validate(null)).toBeNull();
        });
    });

    describe('ngOnChanges', () => {
        it('should disable textInput when disabled changes to true', () => {
            component.disabled = true;
            component.ngOnChanges({ disabled: { currentValue: true } } as any);
            expect(component.form.get('textInput').disabled).toBe(true);
        });

        it('should enable textInput when disabled changes to false', () => {
            component.disabled = true;
            component.ngOnChanges({ disabled: { currentValue: true } } as any);
            component.disabled = false;
            component.ngOnChanges({ disabled: { currentValue: false } } as any);
            expect(component.form.get('textInput').enabled).toBe(true);
        });

        it('should update list validator when required changes', () => {
            component.required = true;
            component.ngOnChanges({ required: { currentValue: true } } as any);
            expect(component.form.get('list').errors).toEqual({ noneSelected: true });
        });

        it('should remove list validation error when required changes to false', () => {
            component.required = true;
            component.ngOnChanges({ required: { currentValue: true } } as any);
            expect(component.form.get('list').errors).toEqual({ noneSelected: true });

            component.required = false;
            component.ngOnChanges({ required: { currentValue: false } } as any);
            expect(component.form.get('list').errors).toBeNull();
        });
    });

    describe('isTouched', () => {
        it('should return false when textInput is not touched', () => {
            expect(component.isTouched()).toBe(false);
        });

        it('should return true when textInput is touched', () => {
            component.form.get('textInput').markAsTouched();
            expect(component.isTouched()).toBe(true);
        });
    });
});

describe('SelectionListValidator', () => {
    it('should return null when control value is null', () => {
        const validator = SelectionListValidator(true);
        const control = new UntypedFormControl(null);
        expect(validator(control)).toBeNull();
    });

    it('should return noneSelected when list is empty and required', () => {
        const validator = SelectionListValidator(true);
        const control = new UntypedFormControl([]);
        expect(validator(control)).toEqual({ noneSelected: true });
    });

    it('should return null when list is empty and not required', () => {
        const validator = SelectionListValidator(false);
        const control = new UntypedFormControl([]);
        expect(validator(control)).toBeNull();
    });

    it('should return null when list has items and required', () => {
        const validator = SelectionListValidator(true);
        const control = new UntypedFormControl([{ value: '1', displayValue: 'Alpha' }]);
        expect(validator(control)).toBeNull();
    });

    it('should return someDisabled when list has disabled items', () => {
        const validator = SelectionListValidator(true);
        const control = new UntypedFormControl([
            { value: '1', displayValue: 'Alpha', disabled: true }
        ]);
        expect(validator(control)).toEqual({ someDisabled: true });
    });
});
