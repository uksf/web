import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, Validators } from '@angular/forms';
import { InstantErrorStateMatcher } from '@app/shared/services/form-helper.service';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ResponseUnit, UnitBranch } from '@app/features/units/models/Units';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';

@Component({
    selector: 'app-add-unit-modal',
    templateUrl: './add-unit-modal.component.html',
    styleUrls: ['./add-unit-modal.component.scss']
})
export class AddUnitModalComponent implements OnInit {
    form: UntypedFormGroup;
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
    original;

    constructor(formbuilder: UntypedFormBuilder, private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.form = formbuilder.group({
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
        if (data) {
            this.edit = true;
            this.unit = data.unit;
            this.form.patchValue(this.unit);
        }
    }

    ngOnInit() {
        this.original = JSON.stringify(this.form.getRawValue());
        this.httpClient.get(`${this.urls.apiUrl}/units`).subscribe({
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
        this.availableParentUnits = this.units.filter((x) => x.branch === this.form.controls['branch'].value);
        if (!this.edit) {
            this.form.controls['parent'].setValue(this.availableParentUnits[0].id);
        } else {
            if (this.unit.parent === '000000000000000000000000') {
                return;
            }

            this.availableParentUnits = this.availableParentUnits.filter((x) => x.id !== this.unit.id);
            if (this.availableParentUnits.find((x) => x.id === this.unit.parent)) {
                this.form.controls['parent'].setValue(this.unit.parent);
            } else {
                this.form.controls['parent'].setValue(this.availableParentUnits[0].id);
            }
        }
    }

    private validateUnit(control: AbstractControl): Observable<ValidationErrors> {
        return timer(200).pipe(
            switchMap(() => {
                if (control.pristine || !control.value) {
                    return of(null);
                }
                return this.httpClient
                    .get(`${this.urls.apiUrl}/units/exists/${control.value}${this.edit ? `?id=${this.unit.id}` : ''}`)
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
            this.unit.name = this.form.controls['name'].value;
            this.unit.shortname = this.form.controls['shortname'].value;
            this.unit.parent = this.form.controls['parent'].value;
            this.unit.branch = this.form.controls['branch'].value;
            this.unit.teamspeakGroup = this.form.controls['teamspeakGroup'].value;
            this.unit.discordRoleId = this.form.controls['discordRoleId'].value;
            this.unit.callsign = this.form.controls['callsign'].value;
            this.unit.icon = this.form.controls['icon'].value;
            this.unit.preferShortname = this.form.controls['preferShortname'].value;
            this.httpClient
                .put(`${this.urls.apiUrl}/units/${this.unit.id}`, this.unit, {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json'
                    })
                })
                .subscribe({
                    next: () => {
                        this.dialog.closeAll();
                        this.pending = false;
                    }
                });
        } else {
            const formString = JSON.stringify(this.form.getRawValue()).replace(/[\n\r]/g, '');
            this.httpClient
                .post(`${this.urls.apiUrl}/units`, formString, {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json'
                    })
                })
                .subscribe({
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
        dialog.afterClosed().subscribe({
            next: (result) => {
                if (result) {
                    this.httpClient.delete(`${this.urls.apiUrl}/units/${this.unit.id}`).subscribe({
                        next: (_) => {
                            this.dialog.closeAll();
                        }
                    });
                }
            }
        });
    }
}
