import { Component } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

@Component({
    selector: 'app-connect-teamspeak-modal',
    templateUrl: './connect-teamspeak-modal.component.html',
    styleUrls: ['./connect-teamspeak-modal.component.scss'],
})
export class ConnectTeamspeakModalComponent {
    constructor(public dialogRef: MatDialogRef<ConnectTeamspeakModalComponent>) {}

    connected() {
        // Called when TeamSpeak connection succeeds - no action needed
    }

    confirmed() {
        this.dialogRef.close();
    }

    cancel() {
        this.dialogRef.close();
    }
}
