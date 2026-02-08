import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirmation-modal',
    templateUrl: './confirmation-modal.component.html',
    styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent {
    text: string;
    button = 'Confirm';

    constructor(public dialogRef: MatDialogRef<ConfirmationModalComponent>, @Inject(MAT_DIALOG_DATA) public data: ConfirmationModalData) {
        this.text = data.message;
        if (data.button) {
            this.button = data.button;
        }
    }

    confirm() {
        this.dialogRef.close(true);
    }

    cancel() {
        this.dialogRef.close(false);
    }
}

export class ConfirmationModalData {
    message: string;
    button?: string;
}
