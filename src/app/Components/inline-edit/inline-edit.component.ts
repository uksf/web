import {
    Component,
    Input,
    ElementRef,
    ViewChild,
    Renderer,
    forwardRef,
    OnInit,
    Output,
    EventEmitter,
    HostListener
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';

const INLINE_EDIT_CONTROL_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InlineEditComponent),
    multi: true
};

@Component({
    selector: 'app-inline-edit',
    templateUrl: './inline-edit.component.html',
    providers: [INLINE_EDIT_CONTROL_VALUE_ACCESSOR],
    styleUrls: ['./inline-edit.component.css']
})
export class InlineEditComponent implements ControlValueAccessor, OnInit {
    @ViewChild('inlineEditControl', {static: false}) inlineEditControl;
    @Input() label = '';
    @Input() type = 'text';
    @Input() required = false;
    @Input() disabled = false;
    @Input() validator: Observable<boolean> = new Observable<boolean>();
    @Output() finishedEvent = new EventEmitter();
    private _value = '';
    private preValue = '';
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
            this.validator.subscribe(invalid => {
                this.invalid = invalid;
            });
        } else {
            this.invalid = false;
        }
    }

    constructor() { }

    ngOnInit() { }

    writeValue(value: any) {
        this._value = value;
    }

    public registerOnChange(fn: (_: any) => {}): void {
        this.onChange = fn;
    }

    public registerOnTouched(fn: () => {}): void {
        this.onTouched = fn;
    }

    unfocus() {
        this.editing = false;
        if (this.invalid) {
            this._value = this.preValue;
            this.onChange(this.preValue);
            this.invalid = false;
        } else if (this.preValue !== this._value) {
            this.finishedEvent.emit(this._value);
            this.invalid = false;
        }
    }

    edit(value) {
        if (this.disabled) { return; }
        this.preValue = value;
        this.editing = true;
        setTimeout(_ => this.inlineEditControl.nativeElement.focus());
    }

    @HostListener('window:keyup', ['$event'])
    keyEvent(event: KeyboardEvent) {
        if (this.editing && event.key === 'Enter') {
            this.unfocus();
        }
    }
}
