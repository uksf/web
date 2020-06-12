import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { InstantErrorStateMatcher } from 'app/Services/formhelper.service';
import { Observable, of, timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-add-unit-modal',
    templateUrl: './add-unit-modal.component.html',
    styleUrls: ['./add-unit-modal.component.css']
})
export class AddUnitModalComponent implements OnInit {
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    form: FormGroup;
    types = [
        { value: 0, viewValue: 'Auxiliary Team' },
        { value: 1, viewValue: 'Section' },
        { value: 2, viewValue: 'Platoon' },
        { value: 3, viewValue: 'Company' },
        { value: 4, viewValue: 'Battalion' },
        { value: 5, viewValue: 'Regiment' },
        { value: 6, viewValue: 'Task Force' },
        { value: 7, viewValue: 'Crew' },
        { value: 8, viewValue: 'Flight' },
        { value: 9, viewValue: 'Squadron' },
        { value: 10, viewValue: 'Wing' },
        { value: 11, viewValue: 'Group' }
    ];
    branchTypes = [
        { value: 0, viewValue: 'Combat' },
        { value: 1, viewValue: 'Auxiliary' }
    ];
    validationMessages = {
        'name': [
            { type: 'required', message: 'Name is required' },
            { type: 'unitTaken', message: 'That name is already in use' }
        ], 'shortname': [
            { type: 'required', message: 'Short name is required' },
            { type: 'unitTaken', message: 'That name is already in use' }
        ], 'type': [
            { type: 'required', message: 'Type is required' }
        ], 'parent': [
            { type: 'required', message: 'Parent is required' }
        ], 'teamspeakGroup': [
            { type: 'unitTaken', message: 'That TeamSpeak ID is already in use' }
        ], 'discordRoleId': [
            { type: 'unitTaken', message: 'That Discord ID is already in use' }
        ], 'callsign': [
            { type: 'unitTaken', message: 'That callsign is already in use' }
        ]
    };
    otherUnits;
    edit = false;
    unit;

    constructor(formbuilder: FormBuilder, private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.form = formbuilder.group({
            name: ['', Validators.required, this.validateUnit.bind(this)],
            shortname: ['', Validators.required, this.validateUnit.bind(this)],
            type: [0, Validators.required],
            parent: [0, Validators.required],
            branch: [0],
            teamspeakGroup: ['', , this.validateUnit.bind(this)],
            discordRoleId: ['', , this.validateUnit.bind(this)],
            callsign: ['', , this.validateUnit.bind(this)],
            icon: ['']
        });
        if (data) {
            this.edit = true;
            this.unit = data.unit;
            this.form.patchValue(this.unit);
        }
    }

    ngOnInit() {
        this.httpClient.get(`${this.urls.apiUrl}/units`).subscribe(response => {
            this.otherUnits = response;
        });
    }

    private validateUnit(control: AbstractControl): Observable<ValidationErrors> {
        if (this.edit) {
            return timer(200).pipe(
                switchMap(() => {
                    if (control.pristine || !control.value) { return of(null); }
                    return this.httpClient.post(`${this.urls.apiUrl}/units/${control.value}`, this.unit).pipe(
                        map(response => (response ? { unitTaken: true } : null))
                    );
                })
            );
        } else {
            return timer(200).pipe(
                switchMap(() => {
                    if (control.pristine || !control.value) { return of(null); }
                    return this.httpClient.post(`${this.urls.apiUrl}/units/${control.value}`, {}).pipe(
                        map(response => (response ? { unitTaken: true } : null))
                    );
                })
            );
        }
    }

    submit() {
        if (this.edit) {
            this.unit.name = this.form.controls['name'].value;
            this.unit.shortname = this.form.controls['shortname'].value;
            this.unit.type = this.form.controls['type'].value;
            this.unit.parent = this.form.controls['parent'].value;
            this.unit.branch = this.form.controls['branch'].value;
            this.unit.teamspeakGroup = this.form.controls['teamspeakGroup'].value;
            this.unit.discordRoleId = this.form.controls['discordRoleId'].value;
            this.unit.callsign = this.form.controls['callsign'].value;
            this.unit.icon = this.form.controls['icon'].value;
            this.httpClient.patch(`${this.urls.apiUrl}/units`, this.unit, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            }).subscribe(_ => {
                this.dialog.closeAll();
            });
        } else {
            const formString = JSON.stringify(this.form.getRawValue()).replace(/\n|\r/g, '');
            this.httpClient.put(`${this.urls.apiUrl}/units`, formString, {
                headers: new HttpHeaders({
                    'Content-Type': 'application/json'
                })
            }).subscribe(_ => {
                this.dialog.closeAll();
            });
        }
    }

    delete() {
        this.httpClient.delete(`${this.urls.apiUrl}/units/${this.unit.id}`).subscribe(_ => {
            this.dialog.closeAll();
        });
    }
}
