import { Component, ContentChild, EventEmitter, forwardRef, HostListener, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { nextFrame } from '../../../Services/helper.service';

@Component({
    selector: 'app-dropdown',
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DropdownComponent),
            multi: true,
        },
    ],
})
export class DropdownComponent implements OnInit, ControlValueAccessor {
    @ContentChild('element', { static: false }) elementTemplateRef: TemplateRef<IDropdownElement>;
    @Input('placeholder') placeholder: string;
    @Input('isRequired') required: boolean = false;
    @Input('isDisabled') disabled: boolean = false;
    @Input('showErrors') showErrors: boolean = true;
    @Input('elements') elements: Observable<IDropdownElement[]>;
    @Input('displayWith') displayWith: (element: IDropdownElement) => string = this.displayElement;
    @Input('elementFilter') elementFilter: (element: IDropdownElement, filter: string) => boolean = this.filterElement;
    @Input('elementMatcher') elementMatcher: (element: IDropdownElement, match: string) => boolean = this.matchElement;
    @Input('elementName') elementName: string;
    @Input('formFieldClass') formFieldClass: string;
    @Input('optionClass') optionClass: string;
    @Output('onSelectionChange') onSelectionChange = new EventEmitter<IDropdownElement>();
    @Input() textModel = '';
    allElements: IDropdownElement[];
    filteredElements: Observable<IDropdownElement[]>;
    validationMessages = [
        { type: 'required', message: () => `${this.elementName} is required` },
        { type: 'invalid', message: () => `Invalid ${this.elementName}. Please select one from the list` },
    ];
    scrollPanelHeight = '456px';
    private cachedFilteredElements: IDropdownElement[];
    private previousModel: IDropdownElement = undefined;
    private screenHeight: number = 1024;

    constructor() {}

    @Input() _model = null;

    get model(): IDropdownElement {
        return this._model;
    }

    set model(value: IDropdownElement) {
        this._model = value;
        this.onChange(this._model);

        if (this._model != this.previousModel) {
            this.onSelectionChange.next(this._model);
            this.previousModel = this._model;
        }
    }

    ngOnInit(): void {
        this.elements.subscribe({
            next: (elements: IDropdownElement[]) => {
                this.allElements = elements;
                this.cachedFilteredElements = elements;
                this.filteredElements = of(elements);

                if (this.model && this.allElements.findIndex((element: IDropdownElement) => element.value === this.model.value) === -1) {
                    this.model = null;
                    this.textModel = '';
                }

                this.screenHeight = window.innerHeight;
                nextFrame(() => {
                    this.setScrollPanelHeight();
                });
            },
        });
    }

    @HostListener('window:resize')
    onResize() {
        this.screenHeight = window.innerHeight;
        this.setScrollPanelHeight();
    }

    displayElement(element: IDropdownElement): string {
        if (!element) {
            return '';
        }

        return element.displayValue;
    }

    matchElement(element: IDropdownElement, match: string): boolean {
        return element.displayValue.toLowerCase() === match;
    }

    filterElement(element: IDropdownElement, filter: string): boolean {
        return element.displayValue.toLowerCase().includes(filter);
    }

    onTextModelChange() {
        let filterValue = typeof this.textModel === 'string' ? this.textModel : (<IDropdownElement>this.textModel).displayValue;

        this.filteredElements = this.elements.pipe(
            startWith(''),
            map(() => this.filterElements(filterValue.toLowerCase()))
        );

        const element = this.allElements.find((element: IDropdownElement) => this.elementMatcher(element, filterValue.toLowerCase()));
        this.model = element ? element : null;
    }

    filterElements(filterValue: string): IDropdownElement[] {
        let filteredElements: IDropdownElement[] = this.allElements;
        const filters = filterValue.split(' ');
        filters.forEach((filter: string) => {
            if (filter !== '') {
                filteredElements = filteredElements.filter((element: IDropdownElement) => this.elementFilter(element, filter));
            }
        });

        this.cachedFilteredElements = filteredElements;
        nextFrame(() => {
            this.setScrollPanelHeight();
        });
        return filteredElements;
    }

    setScrollPanelHeight() {
        let scrollPanelHeight = Math.min(this.cachedFilteredElements.length * 48, 48 * 9.5);

        if (this.screenHeight < 800) {
            scrollPanelHeight = Math.min(scrollPanelHeight, 48 * 6.5);
        }

        if (this.screenHeight < 700) {
            scrollPanelHeight = Math.min(scrollPanelHeight, 48 * 5);
        }

        this.scrollPanelHeight = `${scrollPanelHeight}px`;
    }

    onSelect(event: MatAutocompleteSelectedEvent) {
        this.model = event.option.value;
    }

    writeValue(value: any) {
        this.model = value;
    }

    registerOnTouched() {}

    registerOnChange(func) {
        this.onChange = func;
    }

    onChange = (_: any) => {};
}

export interface IDropdownElement {
    value: string;
    displayValue: string;
    data?: any;
}

export function mapFromElement<T>(type: { new (...args): T }, element: IDropdownElement): T {
    return new type(element);
}
