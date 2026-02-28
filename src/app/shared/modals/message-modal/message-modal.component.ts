import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { AutofocusStopComponent } from '../../components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatButton } from '@angular/material/button';

export interface MessageModalData {
    message: string;
    title?: string;
    button?: string;
}

@Component({
    selector: 'app-message-modal',
    templateUrl: './message-modal.component.html',
    styleUrls: ['./message-modal.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions, MatButton]
})
export class MessageModalComponent {
    title: string = '';
    message: string = 'There should be a different message shown here. Please report this mistake to an admin';
    button: string = 'Close';

    constructor(public dialogRef: MatDialogRef<MessageModalComponent>, @Inject(MAT_DIALOG_DATA) public data: MessageModalData) {
        this.title = data.title || '';
        this.message = data.message;
        if (data.button) {
            this.button = data.button;
        }
    }

    buttonClick() {
        this.dialogRef.close();
    }
}
