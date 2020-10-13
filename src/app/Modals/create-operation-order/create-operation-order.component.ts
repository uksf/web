import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../Services/api.service';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
    selector: 'app-create-operation-order',
    templateUrl: './create-operation-order.component.html',
    styleUrls: ['./create-operation-order.component.css']
})
export class CreateOperationOrderComponent implements OnInit {
    opordform;

    constructor(
        public dialogRef: MatDialogRef<CreateOperationOrderComponent>,
        private api: ApiService,
        private formbuilder: FormBuilder
    ) {
        this.opordform = this.formbuilder.group({
            name: ['', Validators.required],
            map: ['', Validators.required],
            type: ['', Validators.required],
            end: ['', Validators.required],
            start: ['', Validators.required],
            endtime: ['', [Validators.required, Validators.pattern('([0-9][0-9][0-5][0-9])|([0-9][0-9]60)'), Validators.max(2400)]],
            starttime: ['', [Validators.required, Validators.pattern('([0-9][0-9][0-5][0-9])|([0-9][0-9]60)'), Validators.max(2400)]],
        }, {});
    }

    ngOnInit() { }

    submit() {
        this.api.submitForm('/operationorder', this.opordform, this.dialogRef);
    }
}
