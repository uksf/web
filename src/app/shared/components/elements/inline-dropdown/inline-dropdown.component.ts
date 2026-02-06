import { Component, EventEmitter, forwardRef, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { IDropdownElement } from '../dropdown-base/dropdown-base.component';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-inline-dropdown',
    templateUrl: './inline-dropdown.component.html',
    styleUrls: ['./inline-dropdown.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InlineDropdownComponent),
            multi: true
        }
    ]
})
export class InlineDropdownComponent implements OnInit, OnDestroy {
    @Input('placeholder') placeholder: string;
    @Input('isRequired') required: boolean = false;
    @Input('isDisabled') disabled: boolean = false;
    @Input('showErrors') showErrors: boolean = true;
    @Input('elements') elements: Observable<IDropdownElement[]>;
    @Input('tooltip') tooltip: (element: IDropdownElement) => string | null = null;
    @Input('elementName') elementName: string;
    @Input('formFieldClass') formFieldClass: string;
    @Input('optionClass') optionClass: string;
    @Input('mapElementName') mapElementName: (element: IDropdownElement) => string;
    @Output('onSelectionChange') onSelectionChange = new EventEmitter<IDropdownElement>();
    @Input() textModel = '';
    model: Model = {
        dropdownValue: null
    };

    @ViewChild('inlineDropdownControl') inlineDropdownControl;
    @Input() label = '';
    @Input() type = 'text';
    @Input() validator: Observable<boolean> = new Observable<boolean>();
    @Output() finishedEvent = new EventEmitter();
    private _value = '';
    private preValue = '';
    private validatorSubscription: Subscription | null = null;
    editing = false;
    invalid = false;
    public onChange: any = Function.prototype;
    public onTouched: any = Function.prototype;

    get value(): any {
        return this._value;
    }

    set value(v: any) {
        if (v !== this._value) {
            this._value = v;
            this.onChange(v);
            this.validatorSubscription?.unsubscribe();
            this.validatorSubscription = this.validator.subscribe({
                next: (invalid) => {
                    this.invalid = invalid;
                }
            });
        } else {
            this.invalid = false;
        }
    }

    constructor() {}

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.validatorSubscription?.unsubscribe();
    }

    writeValue(value: any) {
        this._value = value;
    }

    public registerOnChange(fn: (_: any) => {}): void {
        this.onChange = fn;
    }

    public registerOnTouched(fn: () => {}): void {
        this.onTouched = fn;
    }

    unfocus(reset: boolean = false) {
        this.editing = false;
        if (this.invalid || reset) {
            this._value = this.preValue;
            this.onChange(this.preValue);
            this.invalid = false;
        } else if (this.preValue !== this._value) {
            this.finishedEvent.emit(this._value);
            this.invalid = false;
        }
    }

    edit(value) {
        if (this.disabled) {
            return;
        }
        this.preValue = value;
        this.editing = true;
        setTimeout((_) => this.inlineDropdownControl.nativeElement.focus());
    }

    @HostListener('window:keyup', ['$event'])
    keyEvent(event: KeyboardEvent) {
        if (this.editing) {
            if (event.key === 'Enter') {
                this.unfocus();
            } else if (event.key === 'Escape') {
                this.unfocus(true);
            }
        }
    }

    getElementName(element: IDropdownElement): string {
        return this.mapElementName(element);
    }
}

interface Model {
    dropdownValue: IDropdownElement;
}
