import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../Services/api.service';

@Component({
    selector: 'app-create-operation-report-modal',
    templateUrl: './create-operation-report-modal.component.html',
    styleUrls: ['./create-operation-report-modal.component.css']
})
export class CreateOperationReportModalComponent implements OnInit {
    oprepform;

    constructor(public dialogRef: MatDialogRef<CreateOperationReportModalComponent>,
        private formbuilder: FormBuilder,
        private api: ApiService) {
        this.oprepform = this.formbuilder.group({
            name: ['', Validators.required],
            map: ['', Validators.required],
            type: ['', Validators.required],
            result: ['', Validators.required],
            end: ['', Validators.required],
            start: ['', Validators.required],
            endtime: ['', [Validators.required, Validators.pattern('([0-9][0-9][0-5][0-9])|([0-9][0-9]60)'), Validators.max(2400)]],
            starttime: ['', [Validators.required, Validators.pattern('([0-9][0-9][0-5][0-9])|([0-9][0-9]60)'), Validators.max(2400)]],
        }, {});
    }

    ngOnInit() { }

    submit() {
        this.api.submitForm('/operationreport', this.oprepform, this.dialogRef);
    }
}
