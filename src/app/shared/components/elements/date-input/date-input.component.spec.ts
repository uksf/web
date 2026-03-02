import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgControl } from '@angular/forms';
import { DateInputComponent } from './date-input.component';

function createComponentWithNgControl(mockNgControl: any): DateInputComponent {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        providers: [
            DateInputComponent,
            { provide: NgControl, useValue: mockNgControl },
        ]
    });
    return TestBed.inject(DateInputComponent);
}

describe('DateInputComponent', () => {
    let component: DateInputComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                DateInputComponent,
            ]
        });
        component = TestBed.inject(DateInputComponent);
    });

    describe('defaults', () => {
        it('should have null value', () => {
            expect(component.value).toBeNull();
        });

        it('should have empty label', () => {
            expect(component.label).toBe('');
        });

        it('should not be disabled', () => {
            expect(component.disabled).toBe(false);
        });

        it('should not be required', () => {
            expect(component.required).toBe(false);
        });

        it('should have null min and max', () => {
            expect(component.min).toBeNull();
            expect(component.max).toBeNull();
        });

        it('should not use touch UI', () => {
            expect(component.touchUi).toBe(false);
        });

        it('should have null dateFilter', () => {
            expect(component.dateFilter).toBeNull();
        });

        it('should reserve error space by default', () => {
            expect(component.reserveErrorSpace).toBe(true);
        });

        it('should not be focused, touched, or dirty', () => {
            expect(component.focused).toBe(false);
            expect(component.touched).toBe(false);
            expect(component.dirty).toBe(false);
        });
    });

    describe('unique inputId', () => {
        it('should have a unique inputId', () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [DateInputComponent]
            });
            const other = TestBed.inject(DateInputComponent);
            expect(component.inputId).not.toBe(other.inputId);
            expect(component.inputId).toMatch(/^date-input-\d+$/);
        });
    });

    describe('displayValue', () => {
        it('should return empty string when value is null', () => {
            expect(component.displayValue).toBe('');
        });

        it('should format date as DD/MM/YYYY', () => {
            component.writeValue(new Date(2024, 2, 15)); // March 15, 2024
            expect(component.displayValue).toBe('15/03/2024');
        });

        it('should format single-digit day and month with leading zeros', () => {
            component.writeValue(new Date(2024, 0, 5)); // January 5, 2024
            expect(component.displayValue).toBe('05/01/2024');
        });
    });

    describe('labelFloating', () => {
        it('should always float when no label is set', () => {
            expect(component.labelFloating).toBe(true);
        });

        it('should not float when empty and unfocused with label', () => {
            component.label = 'Start date';
            expect(component.labelFloating).toBe(false);
        });

        it('should float when focused', () => {
            component.label = 'Start date';
            component.onFocus();
            expect(component.labelFloating).toBe(true);
        });

        it('should float when value is non-null', () => {
            component.label = 'Start date';
            component.writeValue(new Date(2024, 0, 1));
            expect(component.labelFloating).toBe(true);
        });

        it('should stop floating when blurred and empty with label', () => {
            component.label = 'Start date';
            component.onFocus();
            expect(component.labelFloating).toBe(true);
            component.onBlur();
            expect(component.labelFloating).toBe(false);
        });

        it('should stay floating when blurred but has value', () => {
            component.label = 'Start date';
            component.writeValue(new Date(2024, 0, 1));
            component.onFocus();
            component.onBlur();
            expect(component.labelFloating).toBe(true);
        });
    });

    describe('CVA: writeValue', () => {
        it('should set value to a Date', () => {
            const date = new Date(2024, 5, 15);
            component.writeValue(date);
            expect(component.value).toBe(date);
        });

        it('should set value to null', () => {
            component.writeValue(new Date());
            component.writeValue(null);
            expect(component.value).toBeNull();
        });
    });

    describe('CVA: registerOnChange', () => {
        it('should store the onChange callback', () => {
            const fn = vi.fn();
            component.registerOnChange(fn);
            const date = new Date(2024, 5, 15);
            component.onDateChange(date);
            expect(fn).toHaveBeenCalledWith(date);
        });
    });

    describe('CVA: registerOnTouched', () => {
        it('should store the onTouched callback', () => {
            const fn = vi.fn();
            component.registerOnTouched(fn);
            component.onBlur();
            expect(fn).toHaveBeenCalled();
        });
    });

    describe('CVA: setDisabledState', () => {
        it('should set disabled state', () => {
            component.setDisabledState(true);
            expect(component.disabled).toBe(true);
        });

        it('should unset disabled state', () => {
            component.disabled = true;
            component.setDisabledState(false);
            expect(component.disabled).toBe(false);
        });
    });

    describe('onDateChange', () => {
        it('should update value', () => {
            const date = new Date(2024, 5, 15);
            component.onDateChange(date);
            expect(component.value).toBe(date);
        });

        it('should set dirty to true', () => {
            component.onDateChange(new Date());
            expect(component.dirty).toBe(true);
        });

        it('should call onChange callback', () => {
            const fn = vi.fn();
            component.registerOnChange(fn);
            const date = new Date(2024, 5, 15);
            component.onDateChange(date);
            expect(fn).toHaveBeenCalledWith(date);
        });

        it('should handle null value', () => {
            const fn = vi.fn();
            component.registerOnChange(fn);
            component.onDateChange(null);
            expect(component.value).toBeNull();
            expect(fn).toHaveBeenCalledWith(null);
        });
    });

    describe('onFocus', () => {
        it('should set focused to true', () => {
            component.onFocus();
            expect(component.focused).toBe(true);
        });
    });

    describe('onBlur', () => {
        it('should set focused to false', () => {
            component.focused = true;
            component.onBlur();
            expect(component.focused).toBe(false);
        });

        it('should set touched to true', () => {
            component.onBlur();
            expect(component.touched).toBe(true);
        });

        it('should call onTouched callback', () => {
            const fn = vi.fn();
            component.registerOnTouched(fn);
            component.onBlur();
            expect(fn).toHaveBeenCalled();
        });
    });

    describe('openPicker', () => {
        it('should call picker.open when not disabled', () => {
            const openSpy = vi.fn();
            (component as any).picker = { open: openSpy };
            component.openPicker();
            expect(openSpy).toHaveBeenCalled();
        });

        it('should not call picker.open when disabled', () => {
            const openSpy = vi.fn();
            (component as any).picker = { open: openSpy };
            component.disabled = true;
            component.openPicker();
            expect(openSpy).not.toHaveBeenCalled();
        });
    });

    describe('onInputClick', () => {
        it('should delegate to openPicker', () => {
            const openSpy = vi.fn();
            (component as any).picker = { open: openSpy };
            component.onInputClick();
            expect(openSpy).toHaveBeenCalled();
        });
    });

    describe('errorMessage', () => {
        it('should return empty when no ngControl', () => {
            component.ngDoCheck();
            expect(component.errorMessage).toBe('');
        });

        it('should return empty when ngControl present but not touched and not dirty', () => {
            const mockControl = { hasError: () => true, touched: false, dirty: false };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = createComponentWithNgControl(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'Required' }];
            comp.ngDoCheck();

            expect(comp.errorMessage).toBe('');
        });
    });

    describe('hasError', () => {
        it('should be false when errorMessage is empty', () => {
            expect(component.hasError).toBe(false);
        });
    });

    describe('ngDoCheck caching', () => {
        it('should update cachedErrorMessage on ngDoCheck', () => {
            const mockControl = {
                hasError: (type: string) => type === 'required',
                touched: true, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = createComponentWithNgControl(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'Required' }];

            comp.ngDoCheck();

            expect(comp.cachedErrorMessage).toBe('Required');
        });

        it('should return cachedErrorMessage from errorMessage getter', () => {
            const mockControl = {
                hasError: (type: string) => type === 'required',
                touched: true, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = createComponentWithNgControl(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'Required' }];

            comp.ngDoCheck();

            expect(comp.errorMessage).toBe('Required');
            expect(comp.hasError).toBe(true);
        });

        it('should clear cachedErrorMessage when error resolves', () => {
            let hasRequiredError = true;
            const mockControl = {
                hasError: (type: string) => type === 'required' && hasRequiredError,
                touched: true, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = createComponentWithNgControl(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'Required' }];

            comp.ngDoCheck();
            expect(comp.cachedErrorMessage).toBe('Required');

            hasRequiredError = false;
            comp.ngDoCheck();
            expect(comp.cachedErrorMessage).toBe('');
            expect(comp.hasError).toBe(false);
        });
    });

    describe('with NgControl', () => {
        it('should return error message when component is touched', () => {
            const mockControl = {
                hasError: (type: string) => type === 'required',
                touched: false, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = createComponentWithNgControl(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'This field is required' }];
            comp.touched = true;
            comp.ngDoCheck();

            expect(comp.errorMessage).toBe('This field is required');
            expect(comp.hasError).toBe(true);
        });

        it('should return error message when component is dirty', () => {
            const mockControl = {
                hasError: (type: string) => type === 'required',
                touched: false, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = createComponentWithNgControl(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'This field is required' }];
            comp.dirty = true;
            comp.ngDoCheck();

            expect(comp.errorMessage).toBe('This field is required');
        });

        it('should return error message when control.touched is true (external markAsTouched)', () => {
            const mockControl = {
                hasError: (type: string) => type === 'required',
                touched: true, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = createComponentWithNgControl(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'This field is required' }];
            comp.ngDoCheck();

            expect(comp.errorMessage).toBe('This field is required');
            expect(comp.hasError).toBe(true);
        });

        it('should return empty when control has no matching errors', () => {
            const mockControl = {
                hasError: () => false,
                touched: false, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = createComponentWithNgControl(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'Required' }];
            comp.touched = true;
            comp.ngDoCheck();

            expect(comp.errorMessage).toBe('');
            expect(comp.hasError).toBe(false);
        });

        it('should check errorSource when own control has no error', () => {
            const mockControl = {
                hasError: () => false,
                touched: true, dirty: false
            };
            const mockErrorSource = {
                hasError: (type: string) => type === 'matDatepickerMax',
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = createComponentWithNgControl(mockNgControl);
            comp.validationMessages = [{ type: 'matDatepickerMax', message: 'Date too late' }];
            comp.errorSource = mockErrorSource as any;
            comp.ngDoCheck();

            expect(comp.errorMessage).toBe('Date too late');
        });

        it('should support function-based messages', () => {
            const mockControl = {
                hasError: (type: string) => type === 'matDatepickerMin',
                touched: false, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = createComponentWithNgControl(mockNgControl);
            comp.validationMessages = [{ type: 'matDatepickerMin', message: () => 'Date too early' }];
            comp.touched = true;
            comp.ngDoCheck();

            expect(comp.errorMessage).toBe('Date too early');
        });
    });
});
