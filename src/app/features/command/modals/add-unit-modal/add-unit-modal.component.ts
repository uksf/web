import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { Observable, of, timer } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ResponseUnit, UnitBranch } from '@app/features/units/models/units';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { UnitsService } from '../../services/units.service';

@Component({
    selector: 'app-add-unit-modal',
    templateUrl: './add-unit-modal.component.html',
    styleUrls: ['./add-unit-modal.component.scss']
})
export class AddUnitModalComponent implements OnInit {
    form = this.formBuilder.group({
        name: ['', Validators.required, this.validateUnit.bind(this)],
        shortname: ['', Validators.required, this.validateUnit.bind(this)],
        parent: ['', Validators.required],
        branch: [UnitBranch.COMBAT, Validators.required],
        teamspeakGroup: ['', null, this.validateUnit.bind(this)],
        discordRoleId: ['', null, this.validateUnit.bind(this)],
        callsign: ['', null, this.validateUnit.bind(this)],
        icon: [''],
        preferShortname: [false]
    });
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    pending = false;
    branchTypes = [
        { value: UnitBranch.COMBAT, viewValue: 'Combat' },
        { value: UnitBranch.AUXILIARY, viewValue: 'Auxiliary' },
        { value: UnitBranch.SECONDARY, viewValue: 'Secondary' }
    ];
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
            this.form.patchValue(this.unit);
        }
    }

    ngOnInit() {
        this.original = JSON.stringify(this.form.getRawValue());
        this.unitsService.getAllUnits().pipe(first()).subscribe({
            next: (units: ResponseUnit[]) => {
                this.units = units;
                this.resolveAvailableParentUnits();
            }
        });
    }

    get changesMade() {
        return this.original !== JSON.stringify(this.form.getRawValue());
    }

    resolveAvailableParentUnits() {
        this.availableParentUnits = this.units.filter((x) => x.branch === this.form.controls.branch.value);
        if (!this.edit) {
            this.form.controls.parent.setValue(this.availableParentUnits[0].id);
        } else {
            if (this.unit.parent === '000000000000000000000000') {
                return;
            }

            this.availableParentUnits = this.availableParentUnits.filter((x) => x.id !== this.unit.id);
            if (this.availableParentUnits.find((x) => x.id === this.unit.parent)) {
                this.form.controls.parent.setValue(this.unit.parent);
            } else {
                this.form.controls.parent.setValue(this.availableParentUnits[0].id);
            }
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
            this.unit.parent = this.form.controls.parent.value;
            this.unit.branch = this.form.controls.branch.value;
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
            const formString = JSON.stringify(this.form.getRawValue()).replace(/[\n\r]/g, '');
            this.unitsService.createUnit(formString).pipe(first()).subscribe({
                next: () => {
                    this.dialog.closeAll();
                    this.pending = false;
                }
            });
        }
    }

    trackByIndex(index: number): number {
        return index;
    }

    trackByUnitId(index: number, unit: ResponseUnit): string {
        return unit.id;
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
}
