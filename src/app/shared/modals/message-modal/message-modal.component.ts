import { Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

export interface MessageModalData {
    message: string;
    button?: string;
}

@Component({
    selector: 'app-message-modal',
    templateUrl: './message-modal.component.html',
    styleUrls: ['./message-modal.component.scss']
})
export class MessageModalComponent {
    message: string = 'There should be a different message shown here. Please report this mistake to an admin';
    button: string = 'Close';

    constructor(public dialogRef: MatDialogRef<MessageModalComponent>, @Inject(MAT_DIALOG_DATA) public data: MessageModalData) {
        this.message = data.message;
        if (data.button) {
            this.button = data.button;
        }
    }

    buttonClick() {
        this.dialogRef.close();
    }
}
