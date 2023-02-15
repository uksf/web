import { Component, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import {
    AbstractControl,
    ControlContainer,
    ControlValueAccessor,
    FormControl,
    FormGroup,
    FormGroupDirective,
    NG_VALIDATORS,
    NG_VALUE_ACCESSOR,
    NgForm,
    ValidationErrors,
    Validator,
    ValidatorFn
} from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { DropdownBaseComponent, IDropdownElement } from '../dropdown-base/dropdown-base.component';
import { any, nextFrame } from '../../../Services/helper.service';
import { ErrorStateMatcher } from '@angular/material/core';

export class SelectionListErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        return !!(control && (control.dirty || control.touched) && control.parent.get('list').errors !== null);
    }
}

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
    viewProviders: [{ provide: ControlContainer, useExisting: FormGroup }]
})
export class SelectionListComponent extends DropdownBaseComponent implements OnInit, ControlValueAccessor, Validator {
    @Input('listDisabledTooltip') listDisabledTooltip: (element: IDropdownElement) => string = () => '';
    @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;
    form: FormGroup = new FormGroup({
        textInput: new FormControl({ value: '', disabled: this.disabled }),
        list: new FormControl([], SelectionListValidator(this.required))
    });
    listErrorStateMatcher = new SelectionListErrorStateMatcher();
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

    constructor() {
        super();
    }

    ngOnInit(): void {
        this.elementDisabled = this.getDisabled;

        super.ngOnInit();
    }

    onSelect(event: MatAutocompleteSelectedEvent) {
        this.model = event.option.value;

        if (this.clearOnSelect) {
            nextFrame(() => {
                this.form.get('textInput').setValue('');
                this.autocomplete.closePanel();
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
    }

    getDisabled = (element: IDropdownElement): boolean => {
        return this.listModel.includes(element);
    };

    writeValue(value: any) {
        if (value === null) {
            return;
        }

        this.listModel = value;
    }

    registerOnTouched() {}

    registerOnChange(func) {
        this.onListChange = func;
    }

    onListChange = (_: any) => {};

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
