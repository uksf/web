import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';

export interface TextInputModalData {
    message: string;
    title?: string;
}

@Component({
    selector: 'app-text-input-modal',
    templateUrl: './text-input-modal.component.html',
    styleUrls: ['./text-input-modal.component.scss']
})
export class TextInputModalComponent {
    title: string;
    message: string;
    input: string;
    form = this.formBuilder.group({
        input: ['', Validators.required]
    });

    constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<TextInputModalComponent>, @Inject(MAT_DIALOG_DATA) public data: TextInputModalData) {
        this.title = data.title || 'Input';
        this.message = data.message;
    }

    confirm() {
        this.dialogRef.close(this.input);
    }

    cancel() {
        this.dialogRef.close();
    }
}
