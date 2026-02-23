import { Component, forwardRef, Input, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
    AbstractControl,
    ControlContainer,
    ControlValueAccessor,
    UntypedFormControl,
    UntypedFormGroup,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    ValidationErrors,
    Validator,
    ValidatorFn
} from '@angular/forms';
import { MatAutocompleteTrigger, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { getValidationError } from '@app/shared/services/form-helper.service';
import { DropdownBaseComponent, IDropdownElement } from '../dropdown-base/dropdown-base.component';
import { any, nextFrame } from '@app/shared/services/helper.service';

export function SelectionListValidator(required: boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        const list = control.value;
        if (any(list, (element: IDropdownElement) => element.disabled)) {
            return { someDisabled: true };
        }

        return list.length === 0 && required ? { noneSelected: true } : null;
    };
}

@Component({
    selector: 'app-selection-list',
    templateUrl: './selection-list.component.html',
    styleUrls: ['./selection-list.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectionListComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => SelectionListComponent),
            multi: true
        }
    ],
    viewProviders: [{ provide: ControlContainer, useExisting: UntypedFormGroup }],
    standalone: false
})
export class SelectionListComponent extends DropdownBaseComponent implements OnInit, OnChanges, ControlValueAccessor, Validator {
    @Input('listDisabledTooltip') listDisabledTooltip: (element: IDropdownElement) => string = () => '';
    @Input('listPosition') listPosition: string ='top';
    @Input('inputTooltip') inputTooltip: string = '';
    @ViewChild(MatAutocompleteTrigger) autocompleteTriggerRef: MatAutocompleteTrigger;
    form: UntypedFormGroup = new UntypedFormGroup({
        textInput: new UntypedFormControl({ value: '', disabled: this.disabled }),
        list: new UntypedFormControl([], SelectionListValidator(this.required))
    });
    validationMessages = [
        {
            type: 'noneSelected',
            message: () => `At least one ${this.elementName} is required`
        },
        {
            type: 'someDisabled',
            message: () => `No selected ${this.elementName} can be invalid`
        }
    ];
    _listModel: IDropdownElement[] = [];

    get listModel(): IDropdownElement[] {
        return this._listModel;
    }

    set listModel(value: IDropdownElement[]) {
        this._listModel = value;
        this.form.get('list').setValue(this._listModel);

        if (value !== null && value.length > 0) {
            this.form.get('textInput').markAsTouched();
        }

        this.onListChange(value);
        this.revalidate();
    }

    get hasListError(): boolean {
        return this.listErrorMessage.length > 0;
    }

    get listErrorMessage(): string {
        const listControl = this.form.get('list');
        const textInputControl = this.form.get('textInput');
        if (!textInputControl || (!textInputControl.dirty && !textInputControl.touched)) {
            return '';
        }
        return getValidationError(listControl, this.validationMessages);
    }

    constructor() {
        super();
    }

    ngOnInit(): void {
        this.elementDisabled = this.getDisabled;
        super.ngOnInit();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.disabled && this.form) {
            if (this.disabled) {
                this.form.get('textInput').disable();
                this.form.get('textInput').setValue('');
            } else {
                this.form.get('textInput').enable();
            }
        }
        if (changes.required && this.form) {
            this.form.get('list').setValidators(SelectionListValidator(this.required));
            this.revalidate();
        }
    }

    onSelect(event: MatAutocompleteSelectedEvent) {
        this.model = event.option.value;

        if (this.clearOnSelect) {
            nextFrame(() => {
                this.form.get('textInput').setValue('');
                this.autocompleteTriggerRef.closePanel();
                this.textInputElement.nativeElement.blur();
            });
        }

        if (this.model === null) {
            return;
        }

        if (this.listModel.includes(this.model)) {
            return;
        }

        this.listModel = [...this.listModel, this.model];
    }

    remove(element: IDropdownElement) {
        const index = this.listModel.indexOf(element);
        this.listModel.splice(index, 1);
        this.listModel = [...this.listModel];
        this.form.get('textInput').markAsTouched();
    }

    getDisabled = (element: IDropdownElement): boolean => {
        return this.listModel.includes(element);
    };

    writeValue(value: IDropdownElement[] | null) {
        if (value === null) {
            return;
        }

        this.listModel = value;
    }

    registerOnTouched() {}

    registerOnChange(func) {
        this.onListChange = func;
    }

    onListChange = (_: IDropdownElement[]) => {};

    revalidate() {
        this.form.get('textInput').updateValueAndValidity();
        this.form.get('list').updateValueAndValidity();
    }

    validate(control: AbstractControl): ValidationErrors | null {
        return this.form.get('list').errors;
    }

    public isTouched(): boolean {
        return this.form.get('textInput').touched;
    }
}
