import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
    selector: 'app-text-input-modal',
    templateUrl: './text-input-modal.component.html',
    styleUrls: ['./text-input-modal.component.scss']
})
export class TextInputModalComponent implements OnInit {
    @Output() confirmEvent = new EventEmitter<string>();
    @Output() cancelEvent = new EventEmitter();
    message;
    input;
    form: FormGroup;

    constructor(formbuilder: FormBuilder, public dialogRef: MatDialogRef<TextInputModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.message = data.message;
        this.form = formbuilder.group({
            input: ['', Validators.required]
        });
    }

    ngOnInit() { }

    confirm() {
        this.confirmEvent.emit(this.input);
        this.dialogRef.close();
    }

    cancel() {
        this.cancelEvent.emit();
        this.dialogRef.close();
    }
}

