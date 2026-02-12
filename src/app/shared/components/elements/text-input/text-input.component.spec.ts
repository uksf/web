import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextInputComponent } from './text-input.component';

describe('TextInputComponent', () => {
    let component: TextInputComponent;

    beforeEach(() => {
        component = new TextInputComponent(null);
    });

    describe('defaults', () => {
        it('should have default type text', () => {
            expect(component.type).toBe('text');
        });

        it('should not be multiline by default', () => {
            expect(component.multiline).toBe(false);
        });

        it('should have minRows 2 and maxRows 10', () => {
            expect(component.minRows).toBe(2);
            expect(component.maxRows).toBe(10);
        });

        it('should reserve error space by default', () => {
            expect(component.reserveErrorSpace).toBe(true);
        });

        it('should have empty value', () => {
            expect(component.value).toBe('');
        });

        it('should not be focused, touched, or dirty', () => {
            expect(component.focused).toBe(false);
            expect(component.touched).toBe(false);
            expect(component.dirty).toBe(false);
        });
    });

    describe('CVA: writeValue', () => {
        it('should set value', () => {
            component.writeValue('hello');
            expect(component.value).toBe('hello');
        });

        it('should handle null by setting empty string', () => {
            component.writeValue(null as unknown as string);
            expect(component.value).toBe('');
        });

        it('should handle undefined by setting empty string', () => {
            component.writeValue(undefined as unknown as string);
            expect(component.value).toBe('');
        });
    });

    describe('CVA: registerOnChange', () => {
        it('should store the onChange callback', () => {
            const fn = vi.fn();
            component.registerOnChange(fn);
            component.onInput({ target: { value: 'test' } } as unknown as Event);
            expect(fn).toHaveBeenCalledWith('test');
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

    describe('onInput', () => {
        it('should update value from event target', () => {
            component.onInput({ target: { value: 'new value' } } as unknown as Event);
            expect(component.value).toBe('new value');
        });

        it('should set dirty to true', () => {
            component.onInput({ target: { value: 'x' } } as unknown as Event);
            expect(component.dirty).toBe(true);
        });

        it('should call onChange callback', () => {
            const fn = vi.fn();
            component.registerOnChange(fn);
            component.onInput({ target: { value: 'test' } } as unknown as Event);
            expect(fn).toHaveBeenCalledWith('test');
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

    describe('labelFloating', () => {
        it('should not float when empty and unfocused', () => {
            expect(component.labelFloating).toBe(false);
        });

        it('should float when focused', () => {
            component.onFocus();
            expect(component.labelFloating).toBe(true);
        });

        it('should float when value is present', () => {
            component.writeValue('hello');
            expect(component.labelFloating).toBe(true);
        });

        it('should float when both focused and has value', () => {
            component.writeValue('hello');
            component.onFocus();
            expect(component.labelFloating).toBe(true);
        });

        it('should stop floating when blurred and empty', () => {
            component.onFocus();
            expect(component.labelFloating).toBe(true);
            component.onBlur();
            expect(component.labelFloating).toBe(false);
        });

        it('should stay floating when blurred but has value', () => {
            component.writeValue('hello');
            component.onFocus();
            component.onBlur();
            expect(component.labelFloating).toBe(true);
        });
    });

    describe('errorMessage', () => {
        it('should return empty when no ngControl', () => {
            expect(component.errorMessage).toBe('');
        });

        it('should return empty when ngControl present but not touched and not dirty', () => {
            const mockControl = { hasError: () => true, touched: false, dirty: false };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = new TextInputComponent(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'Required' }];

            expect(comp.errorMessage).toBe('');
        });
    });

    describe('hasError', () => {
        it('should be false when errorMessage is empty', () => {
            expect(component.hasError).toBe(false);
        });
    });

    describe('showClearButton', () => {
        it('should be false by default (clearable is false)', () => {
            component.writeValue('hello');
            expect(component.showClearButton).toBe(false);
        });

        it('should be false when clearable but value is empty', () => {
            component.clearable = true;
            expect(component.showClearButton).toBe(false);
        });

        it('should be true when clearable and has value', () => {
            component.clearable = true;
            component.writeValue('hello');
            expect(component.showClearButton).toBe(true);
        });

        it('should be false when clearable and has value but disabled', () => {
            component.clearable = true;
            component.writeValue('hello');
            component.disabled = true;
            expect(component.showClearButton).toBe(false);
        });
    });

    describe('clear', () => {
        it('should reset value to empty string', () => {
            component.writeValue('hello');
            component.clear();
            expect(component.value).toBe('');
        });

        it('should set dirty to true', () => {
            component.clear();
            expect(component.dirty).toBe(true);
        });

        it('should call onChange with empty string', () => {
            const fn = vi.fn();
            component.registerOnChange(fn);
            component.writeValue('hello');
            component.clear();
            expect(fn).toHaveBeenCalledWith('');
        });

        it('should emit cleared event', () => {
            const spy = vi.fn();
            component.cleared.subscribe(spy);
            component.clear();
            expect(spy).toHaveBeenCalled();
        });

        it('should focus the input element', () => {
            const focusSpy = vi.fn();
            (component as any).inputElement = { nativeElement: { focus: focusSpy } };
            component.clear();
            expect(focusSpy).toHaveBeenCalled();
        });

        it('should handle missing inputElement gracefully', () => {
            expect(() => component.clear()).not.toThrow();
        });
    });

    describe('with NgControl', () => {
        it('should return error message when component is touched', () => {
            const mockControl = {
                hasError: (type: string) => type === 'required',
                touched: false, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = new TextInputComponent(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'This field is required' }];
            comp.touched = true;

            expect(comp.errorMessage).toBe('This field is required');
            expect(comp.hasError).toBe(true);
        });

        it('should return error message when component is dirty', () => {
            const mockControl = {
                hasError: (type: string) => type === 'required',
                touched: false, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = new TextInputComponent(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'This field is required' }];
            comp.dirty = true;

            expect(comp.errorMessage).toBe('This field is required');
        });

        it('should return error message when control.touched is true (external markAsTouched)', () => {
            const mockControl = {
                hasError: (type: string) => type === 'required',
                touched: true, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = new TextInputComponent(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'This field is required' }];

            expect(comp.errorMessage).toBe('This field is required');
            expect(comp.hasError).toBe(true);
        });

        it('should return error message when control.dirty is true (external markAsDirty)', () => {
            const mockControl = {
                hasError: (type: string) => type === 'required',
                touched: false, dirty: true
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = new TextInputComponent(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'This field is required' }];

            expect(comp.errorMessage).toBe('This field is required');
        });

        it('should return empty when control has no matching errors', () => {
            const mockControl = {
                hasError: () => false,
                touched: false, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = new TextInputComponent(mockNgControl);
            comp.validationMessages = [{ type: 'required', message: 'Required' }];
            comp.touched = true;

            expect(comp.errorMessage).toBe('');
            expect(comp.hasError).toBe(false);
        });

        it('should support function-based messages', () => {
            const mockControl = {
                hasError: (type: string) => type === 'minlength',
                touched: false, dirty: false
            };
            const mockNgControl = { control: mockControl, valueAccessor: null as unknown } as any;
            const comp = new TextInputComponent(mockNgControl);
            comp.validationMessages = [{ type: 'minlength', message: () => 'Too short' }];
            comp.touched = true;

            expect(comp.errorMessage).toBe('Too short');
        });
    });

});
