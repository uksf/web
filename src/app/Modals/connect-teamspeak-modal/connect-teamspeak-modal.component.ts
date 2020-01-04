import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-connect-teamspeak-modal',
    templateUrl: './connect-teamspeak-modal.component.html',
    styleUrls: ['./connect-teamspeak-modal.component.css']
})
export class ConnectTeamspeakModalComponent {
    constructor(public dialogRef: MatDialogRef<ConnectTeamspeakModalComponent>) { }

    connected() {
        this.dialogRef.close(0);
    }

    cancel() {
        this.dialogRef.close(1);
    }
}
