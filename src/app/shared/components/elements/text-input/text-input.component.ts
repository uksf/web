import { Component, DoCheck, ElementRef, EventEmitter, Input, Optional, Output, Self, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NgControl } from '@angular/forms';
import { getValidationError, ValidationMessage } from '@app/shared/services/form-helper.service';

let nextId = 0;

@Component({
    selector: 'app-text-input',
    templateUrl: './text-input.component.html',
    styleUrls: ['./text-input.component.scss']
})
export class TextInputComponent implements ControlValueAccessor, DoCheck {
    @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

    @Input() label = '';
    @Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
    @Input() inputmode: string | null = null;
    @Input() placeholder = '';
    @Input() disabled = false;
    @Input() required = false;
    @Input() multiline = false;
    @Input() minRows = 1;
    @Input() maxRows = 10;
    @Input() autocomplete = 'off';
    @Input() validationMessages: ValidationMessage[] = [];
    @Input() reserveErrorSpace = true;
    @Input() clearable = false;
    @Input() tooltip = '';
    @Input() hint = '';
    @Input() maxlength: number | null = null;
    /** RegExp tested against each keypress — returning false blocks the character. */
    @Input() keypressFilter: RegExp | null = null;
    /** Additional control to check for validation errors (e.g. parent FormGroup for cross-field validators). */
    @Input() errorSource: AbstractControl | null = null;
    @Output() cleared = new EventEmitter<void>();

    readonly inputId = `text-input-${nextId++}`;
    value = '';
    focused = false;
    touched = false;
    dirty = false;
    cachedErrorMessage = '';

    private onChange: (value: string | number) => void = () => {};
    private onTouched: () => void = () => {};

    constructor(@Optional() @Self() public ngControl: NgControl) {
        if (ngControl) {
            ngControl.valueAccessor = this;
        }
    }

    ngDoCheck(): void {
        this.cachedErrorMessage = this.computeErrorMessage();
    }

    get labelFloating(): boolean {
        return this.focused || this.value.length > 0;
    }

    get showClearButton(): boolean {
        return this.clearable && !this.disabled && this.value.length > 0;
    }

    get errorMessage(): string {
        return this.cachedErrorMessage;
    }

    get hasError(): boolean {
        return this.cachedErrorMessage.length > 0;
    }

    private computeErrorMessage(): string {
        if (!this.ngControl?.control) {
            return '';
        }
        const isTouched = this.touched || this.ngControl.control.touched;
        const isDirty = this.dirty || this.ngControl.control.dirty;
        if (!isTouched && !isDirty) {
            return '';
        }
        const ownError = getValidationError(this.ngControl.control, this.validationMessages);
        if (ownError) {
            return ownError;
        }
        if (this.errorSource) {
            return getValidationError(this.errorSource, this.validationMessages);
        }
        return '';
    }

    focus(): void {
        this.inputElement?.nativeElement?.focus();
    }

    onInput(event: Event): void {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
        this.value = target.value;
        this.dirty = true;
        this.onChange(this.coerceValue(this.value));
    }

    clear(): void {
        this.value = '';
        this.dirty = true;
        this.onChange(this.coerceValue(this.value));
        this.cleared.emit();
        this.inputElement?.nativeElement?.focus();
    }

    onKeyPress(event: KeyboardEvent): boolean {
        if (this.keypressFilter) {
            return this.keypressFilter.test(event.key);
        }
        return true;
    }

    onFocus(): void {
        this.focused = true;
    }

    onBlur(): void {
        this.focused = false;
        this.touched = true;
        this.onTouched();
    }

    writeValue(value: string | number): void {
        this.value = value != null ? String(value) : '';
    }

    registerOnChange(fn: (value: string | number) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    private coerceValue(value: string): string | number {
        if (this.type === 'number' && value !== '') {
            const num = Number(value);
            return isNaN(num) ? value : num;
        }
        return value;
    }
}
