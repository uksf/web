import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-confirmation-modal',
    templateUrl: './confirmation-modal.component.html',
    styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent implements OnInit {
    text;
    button = 'Confirm';
    @Output() confirmEvent = new EventEmitter();
    @Output() cancelEvent = new EventEmitter();

    constructor(public dialogRef: MatDialogRef<ConfirmationModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.text = data.message;
        if (data.button) {
            this.button = data.button;
        }
    }

    ngOnInit() { }

    confirm() {
        this.confirmEvent.emit();
        this.dialogRef.close();
    }

    cancel() {
        this.cancelEvent.emit();
        this.dialogRef.close();
    }
}

