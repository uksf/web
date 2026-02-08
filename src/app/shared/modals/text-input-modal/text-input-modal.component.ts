import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { FormBuilder, Validators } from '@angular/forms';

export interface TextInputModalData {
    message: string;
}

@Component({
    selector: 'app-text-input-modal',
    templateUrl: './text-input-modal.component.html',
    styleUrls: ['./text-input-modal.component.scss']
})
export class TextInputModalComponent {
    message: string;
    input: string;
    form = this.formBuilder.group({
        input: ['', Validators.required]
    });

    constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<TextInputModalComponent>, @Inject(MAT_DIALOG_DATA) public data: TextInputModalData) {
        this.message = data.message;
    }

    confirm() {
        this.dialogRef.close(this.input);
    }

    cancel() {
        this.dialogRef.close();
    }
}
