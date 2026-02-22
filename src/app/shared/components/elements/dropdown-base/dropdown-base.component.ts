import { Component, ContentChild, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { nextFrame } from '@app/shared/services/helper.service';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { DestroyableComponent } from '@app/shared/components';

let nextDropdownId = 0;

@Component({
    template: ``
})
export class DropdownBaseComponent extends DestroyableComponent implements OnInit {
    readonly inputId = `dropdown-${nextDropdownId++}`;
    @ViewChild('textInput') textInput: NgModel;
    @ViewChild('textInput', { read: ElementRef }) textInputElement: ElementRef;
    @ViewChild('textInput', { read: MatAutocompleteTrigger }) autocompleteTrigger: MatAutocompleteTrigger;
    @ContentChild('element', { static: false }) elementTemplateRef: TemplateRef<IDropdownElement>;
    @Input('placeholder') placeholder: string;
    @Input('isRequired') required: boolean = false;
    @Input('isDisabled') disabled: boolean = false;
    @Input('showErrors') showErrors: boolean = true;
    @Input('elements') elements: Observable<IDropdownElement[]>;
    @Input('displayWith') displayWith: (element: IDropdownElement) => string = this.displayElement;
    @Input('elementFilter') elementFilter: (element: IDropdownElement, filter: string) => boolean = this.filterElement;
    @Input('elementMatcher') elementMatcher: (element: IDropdownElement, match: string) => boolean = this.matchElement;
    @Input('elementDisabled') elementDisabled: (element: IDropdownElement) => boolean = null;
    @Input('tooltip') tooltip: (element: IDropdownElement) => string | null = null;
    @Input('trackBy') trackBy: (index: number, element: IDropdownElement) => string = this.trackByDefault;
    @Input('elementName') elementName: string;
    @Input('formFieldClass') formFieldClass: string;
    @Input('optionClass') optionClass: string;
    @Input('autocomplete') autocomplete: boolean = true;
    @Input('clearOnSelect') clearOnSelect: boolean = false;
    @Input('reserveErrorSpace') reserveErrorSpace: boolean = true;
    @Input('textModel') textModel: string = '';

    /** Wrapper for mat-autocomplete's displayWith that handles both IDropdownElement (autocomplete mode) and string (simple mode) */
    autoDisplayWith = (value: IDropdownElement | string): string => {
        if (!value) {
            return '';
        }
        if (typeof value === 'string') {
            return value;
        }
        return this.displayWith(value);
    };
    @Output('selectionChanged') selectionChanged = new EventEmitter<IDropdownElement>();
    _model: IDropdownElement = null;
    allElements: IDropdownElement[];
    filteredElements: Observable<IDropdownElement[]>;
    focused = false;
    validationMessages = [
        { type: 'required', message: () => `${this.elementName} is required` },
        { type: 'invalid', message: () => `Invalid ${this.elementName}, please select one from the list` }
    ];
    scrollPanelHeight = '456px';
    cachedFilteredElements: IDropdownElement[];
    screenHeight: number = 1024;

    constructor() {
        super();
    }

    get model(): IDropdownElement {
        return this._model;
    }

    set model(value: IDropdownElement) {
        this._model = value;
    }

    get labelFloating(): boolean {
        if (!this.autocomplete) {
            return this.focused || !!this._model;
        }
        return this.focused || !!this.textModel;
    }

    onInputFocus(): void {
        this.focused = true;
    }

    onInputBlur(): void {
        this.focused = false;
    }

    ngOnInit(): void {
        this.elements.pipe(takeUntil(this.destroy$)).subscribe({
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
            }
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

    getElementTooltip(element: IDropdownElement): string | null {
        if (this.tooltip === null) {
            return null;
        }

        return this.tooltip(element);
    }

    getElementDisabled(element: IDropdownElement): boolean {
        if (this.elementDisabled === null) {
            return false;
        }

        return this.elementDisabled(element);
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

    onTextModelChange(textModel) {
        if (!this.autocomplete) {
            return;
        }

        let filterValue = typeof textModel === 'string' ? textModel : (<IDropdownElement>textModel).displayValue;
        let filterValueLower = filterValue.toLowerCase();

        this.filteredElements = this.elements.pipe(
            startWith(''),
            map(() => this.filterElements(filterValueLower))
        );

        const element = this.allElements.find((element: IDropdownElement) => this.elementMatcher(element, filterValueLower));
        this.model = element ? element : null;
    }

    clear() {
        this.textModel = '';
        if (this.autocomplete) {
            this.onTextModelChange('');
        } else {
            this.model = null;
            this.filteredElements = of(this.allElements);
            this.cachedFilteredElements = this.allElements;
        }
        this.autocompleteTrigger?.autocomplete?.options?.forEach(option => {
            if (option.selected) {
                option.deselect(false);
            }
        });
    }

    openPanel(): void {
        if (!this.disabled && this.autocompleteTrigger) {
            this.filteredElements = of(this.allElements);
            this.cachedFilteredElements = this.allElements;
            nextFrame(() => {
                this.setScrollPanelHeight();
                this.autocompleteTrigger.openPanel();
                if (!this.autocomplete && this._model) {
                    this.highlightSelectedOption();
                }
            });
        }
    }

    /** In simple mode, highlight the currently selected option in the panel */
    private highlightSelectedOption(): void {
        nextFrame(() => {
            this.autocompleteTrigger?.autocomplete?.options?.forEach(option => {
                if (option.value?.value === this._model?.value) {
                    option.select(false);
                } else if (option.selected) {
                    option.deselect(false);
                }
            });
        });
    }

    onSelect(event: MatAutocompleteSelectedEvent) {
        this.model = event.option.value;
        this.selectionChanged.emit(event.option.value);

        if (!this.autocomplete) {
            this.textModel = this.displayWith(event.option.value);
        }

        if (this.clearOnSelect) {
            nextFrame(() => {
                this.textInput.control.setValue('');
                this.textInputElement.nativeElement.blur();
            });
        }
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

    trackByDefault(index: number, element: IDropdownElement): string {
        return element.value;
    }

    trackByIndex(index: number): number {
        return index;
    }

    public isTouched(): boolean {
        if (!this.textInput) {
            return false;
        }

        return this.textInput.control.touched;
    }
}

export interface IDropdownElement {
    value: string;
    displayValue: string;
    data?: unknown;
    disabled?: boolean;
}

export function mapFromElement<T>(type: { new (...args: unknown[]): T }, element: IDropdownElement): T {
    return element === null ? null : new type(element);
}
