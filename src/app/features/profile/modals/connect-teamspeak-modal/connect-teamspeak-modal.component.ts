import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ConnectTeamspeakComponent, TeamspeakConnectState } from '@app/shared/components/teamspeak-connect/teamspeak-connect.component';

@Component({
    selector: 'app-connect-teamspeak-modal',
    templateUrl: './connect-teamspeak-modal.component.html',
    styleUrls: ['./connect-teamspeak-modal.component.scss'],
})
export class ConnectTeamspeakModalComponent implements AfterViewInit {
    @ViewChild(ConnectTeamspeakComponent) teamspeakConnect: ConnectTeamspeakComponent;
    readonly TeamspeakConnectState = TeamspeakConnectState;

    constructor(
        public dialogRef: MatDialogRef<ConnectTeamspeakModalComponent>,
        private cdr: ChangeDetectorRef
    ) {}

    ngAfterViewInit() {
        this.cdr.detectChanges();
    }

    confirmed() {
        this.dialogRef.close();
    }

    cancel() {
        this.dialogRef.close();
    }
}
