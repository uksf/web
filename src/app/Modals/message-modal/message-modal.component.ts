import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-message-modal',
    templateUrl: './message-modal.component.html',
    styleUrls: ['./message-modal.component.css']
})
export class MessageModalComponent {
    message = 'There should be a different message shown here. Please report this mistake to an admin';
    button = 'Close';

    constructor(public dialog: MatDialogRef<MessageModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.message = data.message;
        if (data.button) {
            this.button = data.button;
        }
    }
}

