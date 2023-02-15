import { Component, forwardRef } from '@angular/core';
import { AbstractControl, ControlContainer, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, NgForm, Validator } from '@angular/forms';
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

    get model(): IDropdownElement {
        return super.model;
    }

    set model(value: IDropdownElement) {
        super.model = value;
        this.onChange(this._model);
    }

    writeValue(value: any) {
        this.model = value;
        if (value) {
            this.textInput.control.setValue(value);
            this.textInput.control.markAsTouched();
        }
    }

    registerOnTouched() {}

    registerOnChange(func) {
        this.onChange = func;
    }

    onChange = (_: any) => {};

    validate(control: AbstractControl) {
        return this.isTouched() ? this.textInput.errors : { untouched: true };
    }
}
