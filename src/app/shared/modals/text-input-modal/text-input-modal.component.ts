import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, Validators } from '@angular/forms';
import { ValidationMessage } from '@app/shared/services/form-helper.service';

export interface TextInputModalData {
    title: string;
}

@Component({
    selector: 'app-text-input-modal',
    templateUrl: './text-input-modal.component.html',
    styleUrls: ['./text-input-modal.component.scss'],
    standalone: false
})
export class TextInputModalComponent {
    title: string;
    form = this.formBuilder.group({
        input: ['', Validators.required]
    });
    validationMessages: ValidationMessage[] = [
        { type: 'required', message: 'Reason is required' }
    ];

    constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<TextInputModalComponent>, @Inject(MAT_DIALOG_DATA) public data: TextInputModalData) {
        this.title = data.title;
    }

    submit() {
        this.dialogRef.close(this.form.get('input').value);
    }

    cancel() {
        this.dialogRef.close();
    }
}
