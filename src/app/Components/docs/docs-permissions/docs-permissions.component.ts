import { Component, forwardRef, Input, OnInit, Type, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { BehaviorSubject } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../elements/dropdown-base/dropdown-base.component';
import { Rank } from '../../../Models/Rank';
import { Unit } from '../../../Models/Units';
import { ControlContainer, ControlValueAccessor, FormGroup, NG_VALUE_ACCESSOR, NgForm } from '@angular/forms';
import { DocumentPermissions } from '../../../Models/Documents';
import { AccountService } from '../../../Services/account.service';
import { Account } from '../../../Models/Account';

export type PermissionsType = 'read' | 'write';

@Component({
    selector: 'app-docs-permissions',
    templateUrl: './docs-permissions.component.html',
    styleUrls: ['./docs-permissions.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef((): Type<any> => DocsPermissionsComponent),
            multi: true
        }
    ],
    viewProviders: [{ provide: ControlContainer, useExisting: FormGroup }]
})
export class DocsPermissionsComponent implements OnInit, ControlValueAccessor {
    @ViewChild(NgForm) form!: NgForm;
    @Input('type') type: PermissionsType = 'read';
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

    constructor(private httpClient: HttpClient, private urlService: UrlService, private accountService: AccountService) {}

    onChange: any = (): void => {};

    ngOnInit(): void {
        this.httpClient.get(`${this.urlService.apiUrl}/units`).subscribe({
            next: (units: Unit[]): void => {
                let elements: IDropdownElement[] = units.map(Unit.mapToElement);
                this.units.next(elements);

                if (this.initialData?.units.length > 0) {
                    this.model.units = elements.filter((x: IDropdownElement): boolean => this.initialData.units.includes(x.value));
                } else {
                    this.accountService.getAccount((account: Account): void => {
                        this.model.units = elements.filter((x: IDropdownElement): boolean => x.displayValue === account.unitAssignment);
                    });
                }

                if (this.initialData?.selectedUnitsOnly) {
                    this.model.selectedUnitsOnly = this.initialData.selectedUnitsOnly;
                }
            }
        });
        this.httpClient.get(`${this.urlService.apiUrl}/ranks`).subscribe({
            next: (ranks: Rank[]): void => {
                let elements: IDropdownElement[] = ranks.map(Rank.mapToElement).reverse();
                this.ranks.next(elements);

                if (this.initialData?.rank) {
                    this.model.rank = elements.find((x: IDropdownElement): boolean => x.value === this.initialData.rank);
                }
            }
        });
    }

    onSelectUnit(elements: IDropdownElement[]): void {
        this.value.units = elements;
    }

    onSelectRank(element: IDropdownElement): void {
        this.value.rank = element;
    }

    onSelectUnitsOnlyChange(): void {
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

    writeValue(value: any): void {
        if (value === null) {
            return;
        }

        this.value = value;
    }

    registerOnChange(func): void {
        this.onChange = func;
    }

    registerOnTouched(): void {}
}

interface FormModel {
    units: IDropdownElement[];
    rank: IDropdownElement;
    selectedUnitsOnly: boolean;
}
