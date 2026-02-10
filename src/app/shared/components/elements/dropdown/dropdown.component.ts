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
    getValidationError = getValidationError;

    constructor() {
        super();
    }

    get model(): IDropdownElement {
        return super.model;
    }

    set model(value: IDropdownElement) {
        super.model = value;
        this.onChange(this._model);
    }

    writeValue(value: IDropdownElement | null) {
        this.model = value;
        if (value) {
            this.textInput.control.setValue(value);
            this.textInput.control.markAsTouched();
        } else {
            this.textModel = '';
            if (this.textInput) {
                this.textInput.control.setValue('');
                this.textInput.control.markAsUntouched();
            } else {
                setTimeout(() => {
                    if (this.textInput) {
                        this.textInput.control.setValue('');
                        this.textInput.control.markAsUntouched();
                    }
                });
            }
        }
    }

    registerOnTouched() {}

    registerOnChange(func) {
        this.onChange = func;
    }

    onChange = (_: IDropdownElement | null) => {};

    validate(control: AbstractControl) {
        return this.isTouched() ? this.textInput.errors : { untouched: true };
    }
}
