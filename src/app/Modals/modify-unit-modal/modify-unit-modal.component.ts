import { Component, OnInit, Inject } from '@angular/core';
import { ApiService } from '../../Services/api.service';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';

@Component({
    selector: 'app-modify-unit-modal',
    templateUrl: './modify-unit-modal.component.html',
    styleUrls: ['./modify-unit-modal.component.css']
})
export class ModifyUnitModalComponent implements OnInit {
    unitdata;
    unitEditForm: FormGroup;
    parents;
    private unitid: string;
    unitsTypes = [
        { value: 'taskforce', viewValue: 'Task Force' },
        { value: 'regiment', viewValue: 'Regiment' },
        { value: 'group', viewValue: 'Group' },
        { value: 'battalion', viewValue: 'Battalion' },
        { value: 'wing', viewValue: 'Wing' },
        { value: 'company', viewValue: 'Company' },
        { value: 'squadron', viewValue: 'Squadron' },
        { value: 'platoon', viewValue: 'Platoon' },
        { value: 'flight', viewValue: 'Flight' },
        { value: 'section', viewValue: 'Section' },
        { value: 'crew', viewValue: 'Crew' },
        { value: 'srteam', viewValue: 'Auxiliary Team' }
    ];

    constructor(
        public dialogRef: MatDialogRef<ModifyUnitModalComponent>,
        private Api: ApiService,
        private formbuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.unitEditForm = this.formbuilder.group({
            icon: ['', Validators.required],
            callsign: ['', Validators.required],
            shortname: ['', Validators.required],
            standardname: ['', Validators.required],
            longname: ['', Validators.required],
            parent: ['', Validators.required],
            type: ['', Validators.required],
            branch: ['', Validators.required],
        }, {});
        this.unitid = data;
        Api.sendRequest(() => {
            return Api.httpClient.get(Api.urls.apiUrl + '/units/' + encodeURI(this.unitid) + '?typeFilter=unitinfo');
        },
            (unitdata) => {
                this.unitdata = unitdata;
                this.unitEditForm.controls.callsign.setValue(unitdata.unitData.callsign);
                this.unitEditForm.controls.icon.setValue(unitdata.unitData.icon);
                this.unitEditForm.controls.shortname.setValue(unitdata.unitData.shortname);
                this.unitEditForm.controls.standardname.setValue(unitdata.unitData.name);
                this.unitEditForm.controls.longname.setValue(unitdata.unitData.longname);
                this.unitEditForm.controls.branch.setValue(unitdata.unitData.branch);
                this.unitEditForm.controls.parent.setValue(unitdata.parent);
                this.unitEditForm.controls.type.setValue(unitdata.type);
            },
            'failed to get regiments');

        Api.sendRequest(
            () => { return Api.httpClient.get(Api.urls.apiUrl + '/units'); },
            (response) => {
                this.parents = response;
            },
            'failed to get parent units in create unit modal'
        );
    }

    ngOnInit() { }

    get imageSource() {
        return this.unitEditForm.controls.icon.value;
    }

    sendUpdate() {
        this.Api.sendRequest(
            () => {
                return this.Api.httpClient.patch(
                    this.Api.urls.apiUrl + '/units/' + encodeURI(this.unitid), this.unitEditForm.value
                );
            },
            () => { },
            'failed to get parent units in create unit modal'
        );
    }
}
