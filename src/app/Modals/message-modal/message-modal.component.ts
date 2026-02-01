import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-message-modal',
    templateUrl: './message-modal.component.html',
    styleUrls: ['./message-modal.component.scss']
})
export class MessageModalComponent {
    message: string = 'There should be a different message shown here. Please report this mistake to an admin';
    button: string = 'Close';
    @Output() buttonEvent: EventEmitter<any> = new EventEmitter();

    constructor(public dialogRef: MatDialogRef<MessageModalComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.message = data.message;
        if (data.button) {
            this.button = data.button;
        }
    }

    buttonClick() {
        this.dialogRef.close();
        this.buttonEvent.emit();
    }
}
