import { Component, OnInit, Output, EventEmitter, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirmation-modal',
    templateUrl: './confirmation-modal.component.html',
    styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent implements OnInit {
    text;
    button = 'Confirm';
    @Output() confirmEvent = new EventEmitter();
    @Output() cancelEvent = new EventEmitter();

    constructor(public dialogRef: MatDialogRef<ConfirmationModalComponent>, @Inject(MAT_DIALOG_DATA) public data: ConfirmationModalData) {
        this.text = data.message;
        if (data.button) {
            this.button = data.button;
        }
    }

    ngOnInit() {}

    confirm() {
        this.dialogRef.close(true);
        this.confirmEvent.emit(); // Keep for backward compatibility during migration
    }

    cancel() {
        this.dialogRef.close(false);
        this.cancelEvent.emit(); // Keep for backward compatibility during migration
    }
}

export class ConfirmationModalData {
    message: string;
    button?: string;
}
