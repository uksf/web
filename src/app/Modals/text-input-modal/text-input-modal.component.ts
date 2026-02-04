import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';

@Component({
    selector: 'app-text-input-modal',
    templateUrl: './text-input-modal.component.html',
    styleUrls: ['./text-input-modal.component.scss']
})
export class TextInputModalComponent {
    message: string;
    input: string;
    form: UntypedFormGroup;

    constructor(formbuilder: UntypedFormBuilder, public dialogRef: MatDialogRef<TextInputModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.message = data.message;
        this.form = formbuilder.group({
            input: ['', Validators.required]
        });
    }

    confirm() {
        this.dialogRef.close(this.input);
    }

    cancel() {
        this.dialogRef.close();
    }
}
