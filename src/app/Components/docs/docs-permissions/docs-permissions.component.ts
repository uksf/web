import { Component, forwardRef, Input, OnInit, Type, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { IDropdownElement, mapFromElement } from '../../elements/dropdown-base/dropdown-base.component';
import { Rank } from '../../../Models/Rank';
import { Unit } from '../../../Models/Units';
import { ControlContainer, ControlValueAccessor, UntypedFormGroup, NG_VALUE_ACCESSOR, NgForm } from '@angular/forms';
import { PermissionRole } from '../../../Models/Documents';
import { AccountService } from '../../../Services/account.service';

export type PermissionsType = 'viewers' | 'collaborators';

interface FormModel {
    units: IDropdownElement[];
    rank: IDropdownElement;
    inherit: boolean;
    expandToSubUnits: boolean;
}

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
    viewProviders: [{ provide: ControlContainer, useExisting: UntypedFormGroup }]
})
export class DocsPermissionsComponent implements OnInit, ControlValueAccessor {
    @ViewChild(NgForm) form!: NgForm;
    @Input('type') type: PermissionsType = 'viewers';
    @Input('initialData') initialData: PermissionRole = null;
    @Input('inheritedPermissions') inheritedPermissions: PermissionRole = null;
    
    ranks: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    units: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    
    private _value: FormModel = this.createEmptyFormModel();
    private _customValues: FormModel | null = null; // Store custom values before inheriting
    private onChange: any = (): void => {};
    
    constructor(private httpClient: HttpClient, private urlService: UrlService) {}

    ngOnInit(): void {
        this.loadDropdownData();
    }

    private loadDropdownData(): void {
        forkJoin({
            units: this.httpClient.get<Unit[]>(`${this.urlService.apiUrl}/units`),
            ranks: this.httpClient.get<Rank[]>(`${this.urlService.apiUrl}/ranks`)
        }).subscribe({
            next: ({ units, ranks }) => {
                this.units.next(units.map(Unit.mapToElement));
                this.ranks.next(ranks.map(Rank.mapToElement).reverse());
                this.initializeFormValues();
            }
        });
    }

    private initializeFormValues(): void {
        if (this.hasInitialData) {
            this.setValuesFromInitialData();
        } else if (this.hasInheritedPermissions) {
            this.setInheritedValues();
        } else {
            this.setDefaultValues();
        }
    }

    private setValuesFromInitialData(): void {
        const unitElements = this.units.value;
        const rankElements = this.ranks.value;

        this.value = {
            units: this.filterElementsByValues(unitElements, this.initialData.units),
            rank: this.findElementByValue(rankElements, this.initialData.rank),
            inherit: false,
            expandToSubUnits: this.initialData.expandToSubUnits !== undefined ? this.initialData.expandToSubUnits : true
        };
    }

    private setInheritedValues(): void {
        const unitElements = this.units.value;
        const rankElements = this.ranks.value;

        this.value = {
            units: this.filterElementsByValues(unitElements, this.inheritedPermissions?.units || []),
            rank: this.findElementByValue(rankElements, this.inheritedPermissions?.rank),
            inherit: true,
            expandToSubUnits: this.inheritedPermissions?.expandToSubUnits !== undefined ? this.inheritedPermissions.expandToSubUnits : true
        };
    }

    private setDefaultValues(): void {
        this.value = this.createEmptyFormModel();
    }

    private createEmptyFormModel(): FormModel {
        return {
            units: [],
            rank: null,
            inherit: false,
            expandToSubUnits: true
        };
    }

    private filterElementsByValues(elements: IDropdownElement[], values: string[]): IDropdownElement[] {
        if (!values || values.length === 0) return [];
        return elements.filter(element => values.includes(element.value));
    }

    private findElementByValue(elements: IDropdownElement[], value: string): IDropdownElement | null {
        if (!value || value.trim() === '') return null;
        return elements.find(element => element.value === value) || null;
    }

    onInheritPermissionsChange(): void {
        if (this.value.inherit) {
            // Store current custom values before switching to inherited values
            this._customValues = {
                units: [...this.value.units],
                rank: this.value.rank,
                inherit: false,
                expandToSubUnits: this.value.expandToSubUnits
            };
            this.setInheritedValues();
        } else {
            // When unchecking inherit, restore custom values if they exist
            if (this._customValues) {
                this.value = { ...this._customValues, inherit: false };
            } else if (this.hasInitialData) {
                // Fallback to initial data if no custom values were stored
                this.setValuesFromInitialData();
            } else {
                // Final fallback to empty values
                this.setDefaultValues();
            }
        }
    }

    onSelectUnit(elements: IDropdownElement[]): void {
        this.value = { ...this.value, units: elements };
    }

    onSelectRank(element: IDropdownElement): void {
        this.value = { ...this.value, rank: element };
    }

    onExpandToSubUnitsChange(value: boolean): void {
        this.value = { ...this.value, expandToSubUnits: value };
    }

    getRankName(element: IDropdownElement): string {
        return mapFromElement(Rank, element).name;
    }

    getUnitName(element: IDropdownElement): string {
        return mapFromElement(Unit, element).name;
    }

    get title(): string {
        return this.type === 'viewers' ? 'Viewers' : 'Collaborators';
    }

    get model(): FormModel {
        return this.value;
    }

    get hasInheritedPermissions(): boolean {
        return this.inheritedPermissions && 
            ((this.inheritedPermissions.units && this.inheritedPermissions.units.length > 0) ||
             (this.inheritedPermissions.rank && this.inheritedPermissions.rank.trim() !== ''));
    }

    private get hasInitialData(): boolean {
        return this.initialData && 
            ((this.initialData.units && this.initialData.units.length > 0) || 
             (this.initialData.rank && this.initialData.rank.trim() !== ''));
    }

    get value(): FormModel {
        return this._value;
    }

    set value(value: FormModel) {
        this._value = value;
        this.onChange(value);
    }

    writeValue(value: any): void {
        if (value !== undefined) {
            this._value = value;
        }
    }

    registerOnChange(func): void {
        this.onChange = func;
    }

    registerOnTouched(): void {}
}
