import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { AutofocusStopComponent } from '../../components/elements/autofocus-stop/autofocus-stop.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatButton } from '@angular/material/button';
import { FlexFillerComponent } from '../../components/elements/flex-filler/flex-filler.component';

@Component({
    selector: 'app-confirmation-modal',
    templateUrl: './confirmation-modal.component.html',
    styleUrls: ['./confirmation-modal.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions, MatButton, FlexFillerComponent]
})
export class ConfirmationModalComponent {
    title: string;
    text: string;
    button = 'Confirm';

    constructor(public dialogRef: MatDialogRef<ConfirmationModalComponent>, @Inject(MAT_DIALOG_DATA) public data: ConfirmationModalData) {
        this.title = data.title || '';
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
    title?: string;
    button?: string;
}
