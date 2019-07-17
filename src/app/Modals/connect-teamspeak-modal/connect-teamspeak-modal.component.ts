import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-connect-teamspeak-modal',
    templateUrl: './connect-teamspeak-modal.component.html',
    styleUrls: ['./connect-teamspeak-modal.component.css']
})
export class ConnectTeamspeakModalComponent {
    constructor(public dialog: MatDialog) { }

    connected() {
        this.dialog.closeAll();
    }
}
