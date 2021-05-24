import { Component, EventEmitter } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-connect-teamspeak-modal',
    templateUrl: './connect-teamspeak-modal.component.html',
    styleUrls: ['./connect-teamspeak-modal.component.css'],
})
export class ConnectTeamspeakModalComponent {
    connectedEvent = new EventEmitter();

    constructor(public dialogRef: MatDialogRef<ConnectTeamspeakModalComponent>) {}

    connected() {
        this.connectedEvent.emit();
    }

    confirmed() {
        this.dialogRef.close();
    }

    cancel() {
        this.dialogRef.close();
    }
}
