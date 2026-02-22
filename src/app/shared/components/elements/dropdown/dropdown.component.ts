import { Component, forwardRef } from '@angular/core';
import { AbstractControl, ControlContainer, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, NgForm, Validator } from '@angular/forms';
import { getValidationError } from '@app/shared/services/form-helper.service';
import { DropdownBaseComponent, IDropdownElement } from '../dropdown-base/dropdown-base.component';

@Component({
    selector: 'app-dropdown',
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DropdownComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => DropdownComponent),
            multi: true
        }
    ],
    viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class DropdownComponent extends DropdownBaseComponent implements ControlValueAccessor, Validator {
    constructor() {
        super();
    }

    get hasError(): boolean {
        return this.errorMessage.length > 0;
    }

    get errorMessage(): string {
        if (!this.isTouched()) {
            return '';
        }
        return getValidationError(this.textInput?.control, this.validationMessages);
    }

    get model(): IDropdownElement {
        return super.model;
    }

    set model(value: IDropdownElement) {
        super.model = value;
        this.onChange(this._model);
    }

    writeValue(value: IDropdownElement | null) {
        if (!this.autocomplete) {
            // Simple mode: set _model directly to avoid onChange feedback loop (writeValue is form→component, not component→form)
            this._model = value;
            this.textModel = value ? this.displayWith(value) : '';
            // Mark touched state for validation — defer if textInput isn't rendered yet
            this.applyTouchedState(!!value);
            return;
        }

        // Autocomplete mode: textInput holds the IDropdownElement; MatAutocompleteTrigger formats via displayWith
        this.model = value;
        const textValue = value ? value : '';
        this.textModel = typeof textValue === 'string' ? textValue : '';
        if (this.textInput) {
            this.textInput.control.setValue(textValue);
            this.applyTouchedState(!!value);
        } else {
            setTimeout(() => {
                if (this.textInput) {
                    this.textInput.control.setValue(textValue);
                    this.applyTouchedState(!!value);
                }
            });
        }
    }

    private applyTouchedState(touched: boolean): void {
        const apply = () => {
            if (this.textInput) {
                if (touched) {
                    this.textInput.control.markAsTouched();
                } else {
                    this.textInput.control.markAsUntouched();
                }
            }
        };
        if (this.textInput) {
            apply();
        } else {
            setTimeout(apply);
        }
    }

    registerOnTouched() {}

    registerOnChange(func) {
        this.onChange = func;
    }

    onChange = (_: IDropdownElement | null) => {};

    validate(control: AbstractControl) {
        if (!this.autocomplete) {
            return !this._model && this.required ? { required: true } : null;
        }
        return this.isTouched() ? this.textInput?.errors : { untouched: true };
    }
}
