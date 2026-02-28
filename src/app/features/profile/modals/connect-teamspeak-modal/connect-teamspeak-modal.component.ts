import { AfterViewInit, ChangeDetectorRef, Component, ViewChild, inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { ConnectTeamspeakComponent, TeamspeakConnectState } from '@app/shared/components/teamspeak-connect/teamspeak-connect.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { ConnectTeamspeakComponent as ConnectTeamspeakComponent_1 } from '../../../../shared/components/teamspeak-connect/teamspeak-connect.component';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-connect-teamspeak-modal',
    templateUrl: './connect-teamspeak-modal.component.html',
    styleUrls: ['./connect-teamspeak-modal.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, ConnectTeamspeakComponent_1, MatDialogActions, MatButton]
})
export class ConnectTeamspeakModalComponent implements AfterViewInit {
    dialogRef = inject<MatDialogRef<ConnectTeamspeakModalComponent>>(MatDialogRef);
    private cdr = inject(ChangeDetectorRef);

    @ViewChild(ConnectTeamspeakComponent) teamspeakConnect: ConnectTeamspeakComponent;
    readonly TeamspeakConnectState = TeamspeakConnectState;

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
