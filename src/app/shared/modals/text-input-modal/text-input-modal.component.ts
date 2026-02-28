import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ValidationMessage } from '@app/shared/services/form-helper.service';
import { AutofocusStopComponent } from '../../components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { TextInputComponent } from '../../components/elements/text-input/text-input.component';
import { MatButton } from '@angular/material/button';

export interface TextInputModalData {
    title: string;
}

@Component({
    selector: 'app-text-input-modal',
    templateUrl: './text-input-modal.component.html',
    styleUrls: ['./text-input-modal.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, TextInputComponent, MatDialogActions, MatButton]
})
export class TextInputModalComponent {
    title: string;
    form = this.formBuilder.group({
        input: ['', Validators.required]
    });
    validationMessages: ValidationMessage[] = [{ type: 'required', message: 'Reason is required' }];

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
