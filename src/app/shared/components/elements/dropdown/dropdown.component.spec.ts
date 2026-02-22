import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';
import { DropdownComponent } from './dropdown.component';
import { IDropdownElement } from '../dropdown-base/dropdown-base.component';

describe('DropdownComponent', () => {
    let component: DropdownComponent;

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

        component = new DropdownComponent();
        component.elements = of(elements);
        component.elementName = 'item';
        component.placeholder = 'Select item';
        // Simulate textInput ViewChild
        component.textInput = {
            control: {
                setValue: vi.fn(),
                markAsTouched: vi.fn(),
                markAsUntouched: vi.fn(),
                touched: false,
                dirty: false,
                errors: null,
                hasError: vi.fn().mockReturnValue(false)
            },
            errors: null
        } as any;
    });

    describe('defaults', () => {
        it('should have null model', () => {
            expect(component.model).toBeNull();
        });

        it('should have empty textModel', () => {
            expect(component.textModel).toBe('');
        });

        it('should not be required by default', () => {
            expect(component.required).toBe(false);
        });

        it('should not be disabled by default', () => {
            expect(component.disabled).toBe(false);
        });

        it('should show errors by default', () => {
            expect(component.showErrors).toBe(true);
        });

        it('should have autocomplete enabled by default', () => {
            expect(component.autocomplete).toBe(true);
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

        it('should not float when blurred and textModel empty', () => {
            component.onInputFocus();
            component.onInputBlur();
            expect(component.labelFloating).toBe(false);
        });
    });

    describe('ngOnInit', () => {
        it('should populate allElements from observable', () => {
            component.ngOnInit();
            expect(component.allElements).toEqual(elements);
        });

        it('should set filteredElements', () => {
            component.ngOnInit();
            expect(component.filteredElements).toBeDefined();
        });

        it('should clear model if value not in elements', () => {
            component._model = { value: '999', displayValue: 'Missing' };
            component.ngOnInit();
            expect(component._model).toBeNull();
            expect(component.textModel).toBe('');
        });
    });

    describe('filterElements', () => {
        it('should filter by display value', () => {
            component.ngOnInit();
            const result = component.filterElements('alp');
            expect(result).toEqual([{ value: '1', displayValue: 'Alpha' }]);
        });

        it('should return all when filter is empty', () => {
            component.ngOnInit();
            const result = component.filterElements('');
            expect(result).toEqual(elements);
        });

        it('should support multi-word filter', () => {
            component.ngOnInit();
            const result = component.filterElements('a');
            expect(result.length).toBe(3); // Alpha, Bravo, Charlie all contain 'a'
        });
    });

    describe('onTextModelChange', () => {
        it('should set model when text matches element exactly', () => {
            component.ngOnInit();
            component.onTextModelChange('alpha');
            expect(component._model).toEqual(elements[0]);
        });

        it('should set model to null when text does not match', () => {
            component.ngOnInit();
            component.onTextModelChange('xyz');
            expect(component._model).toBeNull();
        });
    });

    describe('clear', () => {
        it('should reset textModel to empty string', () => {
            component.textModel = 'Alpha';
            component.ngOnInit();
            component.clear();
            expect(component.textModel).toBe('');
        });

        it('should reset model via onTextModelChange', () => {
            component._model = elements[0];
            component.textModel = 'Alpha';
            component.ngOnInit();
            component.clear();
            expect(component._model).toBeNull();
        });
    });

    describe('onSelect', () => {
        it('should set model from autocomplete selection', () => {
            const onChange = vi.fn();
            component.registerOnChange(onChange);
            component.onSelect({ option: { value: elements[1] } } as any);
            expect(component.model).toEqual(elements[1]);
            expect(onChange).toHaveBeenCalledWith(elements[1]);
        });

        it('should emit selectionChanged on selection', () => {
            const spy = vi.fn();
            component.selectionChanged.subscribe(spy);
            component.onSelect({ option: { value: elements[1] } } as any);
            expect(spy).toHaveBeenCalledWith(elements[1]);
        });
    });

    describe('CVA: writeValue', () => {
        it('should set model and touch textInput when value provided', () => {
            component.writeValue(elements[0]);
            expect(component.model).toEqual(elements[0]);
            expect(component.textInput.control.setValue).toHaveBeenCalledWith(elements[0]);
            expect(component.textInput.control.markAsTouched).toHaveBeenCalled();
        });

        it('should clear textModel when null value provided', () => {
            component.writeValue(null);
            expect(component.textModel).toBe('');
        });
    });

    describe('CVA: registerOnChange', () => {
        it('should store the onChange callback', () => {
            const fn = vi.fn();
            component.registerOnChange(fn);
            component.model = elements[0];
            expect(fn).toHaveBeenCalledWith(elements[0]);
        });
    });

    describe('hasError / errorMessage', () => {
        it('should have no error when untouched', () => {
            expect(component.hasError).toBe(false);
            expect(component.errorMessage).toBe('');
        });

        it('should have no error when touched but no validation errors', () => {
            component.textInput.control.touched = true;
            expect(component.hasError).toBe(false);
        });

        it('should return error message when touched and has required error', () => {
            component.textInput.control.touched = true;
            component.textInput.control.errors = { required: true };
            (component.textInput.control.hasError as ReturnType<typeof vi.fn>).mockImplementation((type: string) => type === 'required');
            expect(component.errorMessage).toBe('item is required');
            expect(component.hasError).toBe(true);
        });

        it('should return invalid message for invalid error', () => {
            component.textInput.control.touched = true;
            component.textInput.control.errors = { invalid: true };
            (component.textInput.control.hasError as ReturnType<typeof vi.fn>).mockImplementation((type: string) => type === 'invalid');
            expect(component.errorMessage).toBe('Invalid item, please select one from the list');
        });
    });

    describe('validate', () => {
        it('should return untouched error when not touched', () => {
            expect(component.validate(null)).toEqual({ untouched: true });
        });

        it('should return textInput errors when touched', () => {
            component.textInput.control.touched = true;
            component.textInput.errors = { required: true };
            expect(component.validate(null)).toEqual({ required: true });
        });

        it('should return null when touched and no errors', () => {
            component.textInput.control.touched = true;
            component.textInput.errors = null;
            expect(component.validate(null)).toBeNull();
        });
    });

    describe('displayWith', () => {
        it('should return displayValue for element', () => {
            expect(component.displayWith(elements[0])).toBe('Alpha');
        });

        it('should return empty string for null', () => {
            expect(component.displayWith(null)).toBe('');
        });
    });

    describe('autoDisplayWith', () => {
        it('should return displayValue for IDropdownElement', () => {
            expect(component.autoDisplayWith(elements[0])).toBe('Alpha');
        });

        it('should return empty string for null', () => {
            expect(component.autoDisplayWith(null)).toBe('');
        });

        it('should pass through string values unchanged', () => {
            expect(component.autoDisplayWith('some text')).toBe('some text');
        });

        it('should return empty string for empty string', () => {
            expect(component.autoDisplayWith('')).toBe('');
        });

        it('should use custom displayWith when set', () => {
            component.displayWith = (el) => `Custom: ${el.displayValue}`;
            expect(component.autoDisplayWith(elements[0])).toBe('Custom: Alpha');
            expect(component.autoDisplayWith('plain string')).toBe('plain string');
        });
    });

    describe('getElementTooltip', () => {
        it('should return null when tooltip function is null', () => {
            expect(component.getElementTooltip(elements[0])).toBeNull();
        });

        it('should call tooltip function when set', () => {
            component.tooltip = (el) => `Tooltip: ${el.displayValue}`;
            expect(component.getElementTooltip(elements[0])).toBe('Tooltip: Alpha');
        });
    });

    describe('getElementDisabled', () => {
        it('should return false when elementDisabled function is null', () => {
            expect(component.getElementDisabled(elements[0])).toBe(false);
        });

        it('should call elementDisabled function when set', () => {
            component.elementDisabled = (el) => el.value === '1';
            expect(component.getElementDisabled(elements[0])).toBe(true);
            expect(component.getElementDisabled(elements[1])).toBe(false);
        });
    });

    describe('simple mode (autocomplete=false)', () => {
        beforeEach(() => {
            component.autocomplete = false;
        });

        describe('labelFloating', () => {
            it('should not float when no model and unfocused', () => {
                expect(component.labelFloating).toBe(false);
            });

            it('should float when model is set', () => {
                component._model = elements[0];
                expect(component.labelFloating).toBe(true);
            });

            it('should float when focused', () => {
                component.onInputFocus();
                expect(component.labelFloating).toBe(true);
            });

            it('should not float based on textModel alone', () => {
                component.textModel = 'Alpha';
                expect(component.labelFloating).toBe(false);
            });
        });

        describe('onTextModelChange', () => {
            it('should skip filtering in simple mode', () => {
                component.ngOnInit();
                const initialFiltered = component.filteredElements;
                component.onTextModelChange('alpha');
                // Model should not be set via text change in simple mode
                expect(component.filteredElements).toBe(initialFiltered);
            });
        });

        describe('onSelect', () => {
            it('should set textModel to displayValue on selection', () => {
                const onChange = vi.fn();
                component.registerOnChange(onChange);
                component.onSelect({ option: { value: elements[1] } } as any);
                expect(component.model).toEqual(elements[1]);
                expect(component.textModel).toBe('Bravo');
                expect(onChange).toHaveBeenCalledWith(elements[1]);
            });

            it('should emit selectionChanged on selection', () => {
                const spy = vi.fn();
                component.selectionChanged.subscribe(spy);
                component.onSelect({ option: { value: elements[2] } } as any);
                expect(spy).toHaveBeenCalledWith(elements[2]);
            });
        });

        describe('clear', () => {
            it('should reset model and textModel', () => {
                component._model = elements[0];
                component.textModel = 'Alpha';
                component.ngOnInit();
                component.clear();
                expect(component.textModel).toBe('');
                expect(component._model).toBeNull();
            });

            it('should reset filteredElements to all elements', () => {
                component.ngOnInit();
                component._model = elements[0];
                component.textModel = 'Alpha';
                component.clear();
                let result: IDropdownElement[] = [];
                component.filteredElements.subscribe({ next: (els) => result = els });
                expect(result).toEqual(elements);
            });
        });

        describe('writeValue', () => {
            it('should set textModel to displayValue when value provided', () => {
                component.writeValue(elements[0]);
                expect(component.textModel).toBe('Alpha');
                expect(component.model).toEqual(elements[0]);
            });

            it('should clear textModel when null value provided', () => {
                component.writeValue(elements[0]);
                component.writeValue(null);
                expect(component.textModel).toBe('');
            });
        });

        describe('validate', () => {
            it('should return null when model has a value', () => {
                component._model = elements[0];
                expect(component.validate(null)).toBeNull();
            });

            it('should return null when model has a value even if required', () => {
                component.required = true;
                component._model = elements[0];
                expect(component.validate(null)).toBeNull();
            });

            it('should return null when no model and not required', () => {
                expect(component.validate(null)).toBeNull();
            });

            it('should return required error when no model and required', () => {
                component.required = true;
                expect(component.validate(null)).toEqual({ required: true });
            });

            it('should return null after writeValue sets a model', () => {
                component.required = true;
                expect(component.validate(null)).toEqual({ required: true });
                component.writeValue(elements[0]);
                expect(component.validate(null)).toBeNull();
            });
        });

        describe('openPanel', () => {
            it('should not open when disabled', () => {
                component.disabled = true;
                component.ngOnInit();
                const trigger = { openPanel: vi.fn() };
                component.autocompleteTrigger = trigger as any;
                component.openPanel();
                expect(trigger.openPanel).not.toHaveBeenCalled();
            });

            it('should reset filteredElements to all elements', () => {
                component.ngOnInit();
                component.autocompleteTrigger = { openPanel: vi.fn() } as any;
                component.openPanel();
                let result: IDropdownElement[] = [];
                component.filteredElements.subscribe({ next: (els) => result = els });
                expect(result).toEqual(elements);
            });
        });
    });
});
