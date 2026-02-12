import { Component, ElementRef, EventEmitter, Input, Optional, Output, Self, ViewChild, ViewEncapsulation } from '@angular/core';

let nextId = 0;
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { getValidationError, ValidationMessage } from '@app/shared/services/form-helper.service';

@Component({
    selector: 'app-text-input',
    templateUrl: './text-input.component.html',
    styleUrls: ['./text-input.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class TextInputComponent implements ControlValueAccessor {
    @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

    @Input() label = '';
    @Input() type: 'text' | 'email' | 'password' | 'number' = 'text';
    @Input() placeholder = '';
    @Input() disabled = false;
    @Input() required = false;
    @Input() multiline = false;
    @Input() minRows = 2;
    @Input() maxRows = 10;
    @Input() autocomplete = 'off';
    @Input() validationMessages: ValidationMessage[] = [];
    @Input() reserveErrorSpace = true;
    @Input() clearable = false;
    @Input() tooltip = '';
    @Output() cleared = new EventEmitter<void>();

    readonly inputId = `text-input-${nextId++}`;
    value = '';
    focused = false;
    touched = false;
    dirty = false;

    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};

    constructor(@Optional() @Self() public ngControl: NgControl) {
        if (ngControl) {
            ngControl.valueAccessor = this;
        }
    }

    get labelFloating(): boolean {
        return this.focused || this.value.length > 0;
    }

    get showClearButton(): boolean {
        return this.clearable && !this.disabled && this.value.length > 0;
    }

    get errorMessage(): string {
        if (!this.ngControl?.control) {
            return '';
        }
        const isTouched = this.touched || this.ngControl.control.touched;
        const isDirty = this.dirty || this.ngControl.control.dirty;
        if (!isTouched && !isDirty) {
            return '';
        }
        return getValidationError(this.ngControl.control, this.validationMessages);
    }

    get hasError(): boolean {
        return this.errorMessage.length > 0;
    }

    onInput(event: Event): void {
        const target = event.target as HTMLInputElement | HTMLTextAreaElement;
        this.value = target.value;
        this.dirty = true;
        this.onChange(this.value);
    }

    clear(): void {
        this.value = '';
        this.dirty = true;
        this.onChange(this.value);
        this.cleared.emit();
        this.inputElement?.nativeElement?.focus();
    }

    onFocus(): void {
        this.focused = true;
    }

    onBlur(): void {
        this.focused = false;
        this.touched = true;
        this.onTouched();
    }

    writeValue(value: string): void {
        this.value = value ?? '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
