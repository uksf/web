import { Component, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../elements/dropdown-base/dropdown-base.component';
import { Rank } from '../../../Models/Rank';
import { Unit } from '../../../Models/Units';
import { ControlContainer, ControlValueAccessor, FormGroup, NG_VALUE_ACCESSOR, NgForm } from '@angular/forms';
import { DocumentPermissions } from '../../../Models/Documents';

@Component({
    selector: 'app-docs-permissions',
    templateUrl: './docs-permissions.component.html',
    styleUrls: ['./docs-permissions.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DocsPermissionsComponent),
            multi: true
        }
    ],
    viewProviders: [{ provide: ControlContainer, useExisting: FormGroup }]
})
export class DocsPermissionsComponent implements OnInit, ControlValueAccessor {
    @ViewChild(NgForm) form!: NgForm;
    @Input('type') type: string = 'read';
    @Input('initialData') initialData: DocumentPermissions = null;
    model: FormModel = {
        units: [],
        rank: null,
        selectedUnitsOnly: false
    };
    ranks: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    units: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    _value: FormModel = {
        units: [],
        rank: null,
        selectedUnitsOnly: false
    };
    onChange: any = () => {};

    constructor(private httpClient: HttpClient, private urlService: UrlService) {}

    ngOnInit(): void {
        this.httpClient.get(`${this.urlService.apiUrl}/units`).subscribe({
            next: (units: Unit[]) => {
                let elements = units.map(Unit.mapToElement);
                this.units.next(elements);

                if (this.initialData?.units.length > 0) {
                    this.model.units = elements.filter((x) => this.initialData.units.includes(x.value));
                }

                if (this.initialData?.selectedUnitsOnly) {
                    this.model.selectedUnitsOnly = this.initialData.selectedUnitsOnly;
                }
            }
        });
        this.httpClient.get(`${this.urlService.apiUrl}/ranks`).subscribe({
            next: (ranks: Rank[]) => {
                let elements = ranks.map(Rank.mapToElement).reverse();
                this.ranks.next(elements);

                if (this.initialData?.rank) {
                    this.model.rank = elements.find((x) => x.value === this.initialData.rank);
                }
            }
        });
    }

    onSelectUnit(elements: IDropdownElement[]) {
        this.value.units = elements;
    }

    onSelectRank(element: IDropdownElement) {
        this.value.rank = element;
    }

    onSelectUnitsOnlyChange() {
        this.value.selectedUnitsOnly = this.model.selectedUnitsOnly;
    }

    getRankName(element: IDropdownElement): string {
        return mapFromElement(Rank, element).name;
    }

    getUnitName(element: IDropdownElement): string {
        return mapFromElement(Unit, element).name;
    }

    get title(): string {
        return this.type === 'read' ? 'Read Permissions' : 'Write Permissions';
    }

    get value(): FormModel {
        return this._value;
    }

    set value(value: FormModel) {
        this._value = value;
        this.onChange(this._value);
    }

    writeValue(value: any) {
        if (value === null) {
            return;
        }

        this.value = value;
    }

    registerOnChange(func) {
        this.onChange = func;
    }

    registerOnTouched() {}
}

interface FormModel {
    units: IDropdownElement[];
    rank: IDropdownElement;
    selectedUnitsOnly: boolean;
}
