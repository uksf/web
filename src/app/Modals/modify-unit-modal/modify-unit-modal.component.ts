import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';

@Component({
    selector: 'app-modify-unit-modal',
    templateUrl: './modify-unit-modal.component.html',
    styleUrls: ['./modify-unit-modal.component.css'],
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
        { value: 'srteam', viewValue: 'Auxiliary Team' },
    ];

    constructor(private httpClient: HttpClient, private urlService: UrlService, private formbuilder: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.unitEditForm = this.formbuilder.group(
            {
                icon: ['', Validators.required],
                callsign: ['', Validators.required],
                shortname: ['', Validators.required],
                standardname: ['', Validators.required],
                longname: ['', Validators.required],
                parent: ['', Validators.required],
                type: ['', Validators.required],
                branch: ['', Validators.required],
            },
            {}
        );
        this.unitid = data;
        this.httpClient.get(`${this.urlService.apiUrl}/units/${encodeURI(this.unitid)}?typeFilter=unitinfo`).subscribe((unitdata) => {
            this.unitdata = unitdata;
            this.unitEditForm.controls.callsign.setValue(this.unitdata.unitData.callsign);
            this.unitEditForm.controls.icon.setValue(this.unitdata.unitData.icon);
            this.unitEditForm.controls.shortname.setValue(this.unitdata.unitData.shortname);
            this.unitEditForm.controls.standardname.setValue(this.unitdata.unitData.name);
            this.unitEditForm.controls.longname.setValue(this.unitdata.unitData.longname);
            this.unitEditForm.controls.branch.setValue(this.unitdata.unitData.branch);
            this.unitEditForm.controls.parent.setValue(this.unitdata.parent);
            this.unitEditForm.controls.type.setValue(this.unitdata.type);
        });

        this.httpClient.get(`${this.urlService.apiUrl}/units`).subscribe((response) => {
            this.parents = response;
        });
    }

    ngOnInit() {}

    get imageSource() {
        return this.unitEditForm.controls.icon.value;
    }

    sendUpdate() {
        this.httpClient.patch(`${this.urlService.apiUrl}/units/${encodeURI(this.unitid)}`, this.unitEditForm.value);
    }
}
