import { Component, DoCheck, Input, ViewChild, inject } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NgControl } from '@angular/forms';
import { getValidationError, ValidationMessage } from '@app/shared/services/form-helper.service';
import { MatIcon } from '@angular/material/icon';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { formatDate } from '@angular/common';

let nextId = 0;

@Component({
    selector: 'app-date-input',
    templateUrl: './date-input.component.html',
    styleUrls: ['./date-input.component.scss'],
    imports: [MatIcon, MatDatepickerModule]
})
export class DateInputComponent implements ControlValueAccessor, DoCheck {
    ngControl = inject(NgControl, { optional: true, self: true });

    @ViewChild('picker') picker!: MatDatepicker<Date>;

    @Input() label = '';
    @Input() disabled = false;
    @Input() required = false;
    @Input() min: Date | null = null;
    @Input() max: Date | null = null;
    @Input() touchUi = false;
    @Input() dateFilter: ((date: Date | null) => boolean) | null = null;
    @Input() validationMessages: ValidationMessage[] = [];
    @Input() reserveErrorSpace = true;
    @Input() errorSource: AbstractControl | null = null;

    readonly inputId = `date-input-${nextId++}`;
    value: Date | null = null;
    focused = false;
    touched = false;
    dirty = false;
    cachedErrorMessage = '';

    private onChange: (value: Date | null) => void = () => {};
    private onTouched: () => void = () => {};

    constructor() {
        const ngControl = this.ngControl;
        if (ngControl) {
            ngControl.valueAccessor = this;
        }
    }

    ngDoCheck(): void {
        this.cachedErrorMessage = this.computeErrorMessage();
    }

    get labelFloating(): boolean {
        return !this.label || this.focused || this.value != null;
    }

    get displayValue(): string {
        if (!this.value) {
            return '';
        }
        return formatDate(this.value, 'dd/MM/yyyy', 'en-GB');
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

    openPicker(): void {
        if (!this.disabled) {
            this.picker.open();
        }
    }

    onInputClick(): void {
        this.openPicker();
    }

    onDateChange(value: Date | null): void {
        this.value = value;
        this.dirty = true;
        this.onChange(value);
    }

    onFocus(): void {
        this.focused = true;
    }

    onBlur(): void {
        this.focused = false;
        this.touched = true;
        this.onTouched();
    }

    writeValue(value: Date | null): void {
        this.value = value;
    }

    registerOnChange(fn: (value: Date | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
