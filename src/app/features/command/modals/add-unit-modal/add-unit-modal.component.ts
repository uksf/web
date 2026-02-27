import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { getValidationError } from '@app/shared/services/form-helper.service';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ResponseUnit, UnitBranch } from '@app/features/units/models/units';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { UnitsService } from '../../services/units.service';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';

@Component({
    selector: 'app-add-unit-modal',
    templateUrl: './add-unit-modal.component.html',
    styleUrls: ['./add-unit-modal.component.scss'],
    standalone: false
})
export class AddUnitModalComponent implements OnInit {
    form = this.formBuilder.group({
        name: ['', Validators.required, this.validateUnit.bind(this)],
        shortname: ['', Validators.required, this.validateUnit.bind(this)],
        parent: new FormControl<IDropdownElement | null>(null, Validators.required),
        branch: new FormControl<IDropdownElement | null>(null, Validators.required),
        teamspeakGroup: ['', null, this.validateUnit.bind(this)],
        discordRoleId: ['', null, this.validateUnit.bind(this)],
        callsign: ['', null, this.validateUnit.bind(this)],
        icon: [''],
        preferShortname: [false]
    });
    getValidationError = getValidationError;
    pending = false;
    branchElements: IDropdownElement[] = [
        { value: String(UnitBranch.COMBAT), displayValue: 'Combat' },
        { value: String(UnitBranch.AUXILIARY), displayValue: 'Auxiliary' },
        { value: String(UnitBranch.SECONDARY), displayValue: 'Secondary' }
    ];
    branchElements$ = of(this.branchElements);
    parentElements$ = new BehaviorSubject<IDropdownElement[]>([]);
    validationMessages = {
        name: [
            { type: 'required', message: 'Name is required' },
            { type: 'unitTaken', message: 'That name is already in use' }
        ],
        shortname: [
            { type: 'required', message: 'Short name is required' },
            { type: 'unitTaken', message: 'That name is already in use' }
        ],
        parent: [{ type: 'required', message: 'Parent is required' }],
        teamspeakGroup: [{ type: 'unitTaken', message: 'That TeamSpeak ID is already in use' }],
        discordRoleId: [{ type: 'unitTaken', message: 'That Discord ID is already in use' }],
        callsign: [{ type: 'unitTaken', message: 'That callsign is already in use' }]
    };
    units: ResponseUnit[];
    availableParentUnits: ResponseUnit[] = [];
    unit: ResponseUnit;
    edit = false;
    original: string;

    constructor(private formBuilder: FormBuilder, private unitsService: UnitsService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: { unit?: ResponseUnit }) {
        if (data) {
            this.edit = true;
            this.unit = data.unit;
            this.form.patchValue({
                name: this.unit.name,
                shortname: this.unit.shortname,
                teamspeakGroup: this.unit.teamspeakGroup,
                discordRoleId: this.unit.discordRoleId,
                callsign: this.unit.callsign,
                icon: this.unit.icon,
                preferShortname: this.unit.preferShortname
            });
            this.form.controls.branch.setValue(this.branchElements.find(e => e.value === String(this.unit.branch)));
        } else {
            this.form.controls.branch.setValue(this.branchElements[0]);
        }
    }

    ngOnInit() {
        this.original = JSON.stringify(this.getFormRawValues());
        this.unitsService.getAllUnits().pipe(first()).subscribe({
            next: (units: ResponseUnit[]) => {
                this.units = units;
                this.resolveAvailableParentUnits();
            }
        });
    }

    get changesMade() {
        return this.original !== JSON.stringify(this.getFormRawValues());
    }

    resolveAvailableParentUnits() {
        const selectedBranch = Number(this.form.controls.branch.value?.value);
        this.availableParentUnits = this.units.filter((x) => x.branch === selectedBranch);
        const parentElements = this.availableParentUnits.map(u => ({ value: u.id, displayValue: u.name }));

        if (!this.edit) {
            this.parentElements$.next(parentElements);
            this.form.controls.parent.setValue(parentElements[0] ?? null);
        } else {
            if (this.unit.parent === '000000000000000000000000') {
                this.parentElements$.next(parentElements);
                return;
            }

            this.availableParentUnits = this.availableParentUnits.filter((x) => x.id !== this.unit.id);
            const filteredParentElements = this.availableParentUnits.map(u => ({ value: u.id, displayValue: u.name }));
            this.parentElements$.next(filteredParentElements);

            const matchingParent = filteredParentElements.find(e => e.value === this.unit.parent);
            this.form.controls.parent.setValue(matchingParent ?? filteredParentElements[0] ?? null);
        }
    }

    private validateUnit(control: AbstractControl): Observable<ValidationErrors> {
        return timer(200).pipe(
            switchMap(() => {
                if (control.pristine || !control.value) {
                    return of(null);
                }
                return this.unitsService
                    .checkUnitExists(control.value, this.edit ? this.unit.id : undefined)
                    .pipe(map((exists: boolean) => (exists ? { unitTaken: true } : null)));
            })
        );
    }

    submit() {
        if (!this.form.valid || !this.changesMade || this.pending) {
            return;
        }

        this.pending = true;
        if (this.edit) {
            this.unit.name = this.form.controls.name.value;
            this.unit.shortname = this.form.controls.shortname.value;
            this.unit.parent = this.form.controls.parent.value?.value;
            this.unit.branch = Number(this.form.controls.branch.value?.value);
            this.unit.teamspeakGroup = this.form.controls.teamspeakGroup.value;
            this.unit.discordRoleId = this.form.controls.discordRoleId.value;
            this.unit.callsign = this.form.controls.callsign.value;
            this.unit.icon = this.form.controls.icon.value;
            this.unit.preferShortname = this.form.controls.preferShortname.value;
            this.unitsService.updateUnit(this.unit.id, this.unit).pipe(first()).subscribe({
                next: () => {
                    this.dialog.closeAll();
                    this.pending = false;
                }
            });
        } else {
            const payload = this.getFormRawValues();
            const formString = JSON.stringify(payload).replace(/[\n\r]/g, '');
            this.unitsService.createUnit(formString).pipe(first()).subscribe({
                next: () => {
                    this.dialog.closeAll();
                    this.pending = false;
                }
            });
        }
    }

    delete() {
        if (this.pending) {
            return;
        }

        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${this.unit.name}'?` }
        });
        dialog.afterClosed().pipe(first()).subscribe({
            next: (result) => {
                if (result) {
                    this.unitsService.deleteUnit(this.unit.id).pipe(first()).subscribe({
                        next: (_) => {
                            this.dialog.closeAll();
                        }
                    });
                }
            }
        });
    }

    private getFormRawValues() {
        const raw = this.form.getRawValue();
        return {
            ...raw,
            branch: Number(raw.branch?.value ?? 0),
            parent: raw.parent?.value ?? ''
        };
    }
}
