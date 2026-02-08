import { Component, EventEmitter, forwardRef, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

const INLINE_EDIT_CONTROL_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InlineEditComponent),
    multi: true
};

@Component({
    selector: 'app-inline-edit',
    templateUrl: './inline-edit.component.html',
    providers: [INLINE_EDIT_CONTROL_VALUE_ACCESSOR],
    styleUrls: ['./inline-edit.component.scss']
})
export class InlineEditComponent implements ControlValueAccessor, OnInit, OnDestroy {
    @ViewChild('inlineEditControl') inlineEditControl;
    @Input() label = '';
    @Input() type = 'text';
    @Input() required = false;
    @Input() disabled = false;
    @Input() validator: Observable<boolean> = new Observable<boolean>();
    @Output() finishedEvent = new EventEmitter();
    private _value = '';
    private preValue = '';
    private validatorSubscription: Subscription | null = null;
    editing = false;
    invalid = false;
    public onChange: (value: string) => void = Function.prototype as () => void;
    public onTouched: () => void = Function.prototype as () => void;

    get value(): string {
        return this._value;
    }

    set value(v: string) {
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

    ngOnInit() {}

    ngOnDestroy() {
        this.validatorSubscription?.unsubscribe();
    }

    writeValue(value: string) {
        this._value = value;
    }

    public registerOnChange(fn: (value: string) => void): void {
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
        setTimeout((_) => this.inlineEditControl.nativeElement.focus());
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
}
