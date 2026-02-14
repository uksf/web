import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { TeamspeakConnectService } from '@app/shared/services/teamspeak-connect.service';
import { AccountService } from '@app/core/services/account.service';
import { SignalRService, ConnectionContainer } from '@app/core/services/signalr.service';
import { nextFrame } from '@app/shared/services/helper.service';
import { UksfError } from '@app/shared/models/response';
import { TeamspeakConnectClient } from '@app/shared/models/teamspeak-connect-client';
import { DebouncedCallback } from '@app/shared/utils/debounce-callback';

@Component({
    selector: 'app-teamspeak-connect',
    templateUrl: './teamspeak-connect.component.html',
    styleUrls: ['./teamspeak-connect.component.scss']
})
export class ConnectTeamspeakComponent implements OnInit, OnDestroy {
    @Input() showCancel = false;
    @Input() showButtons = true;
    @Output() connectedEvent = new EventEmitter();
    @Output() confirmedEvent = new EventEmitter();
    @Output() cancelEvent = new EventEmitter();
    formGroup = this.formBuilder.group({
        code: ['', Validators.required]
    });
    teamspeakForm = this.formBuilder.group({
        teamspeakId: ['', Validators.required]
    });
    pending = false;
    state = 0;
    clients: TeamspeakConnectClient[] = [];
    errorMessage: string = 'Unknown error. Please try again';
    private previousResponse = '-1';
    private hubConnection: ConnectionContainer;
    private destroy$ = new Subject<void>();
    private debouncedUpdate = new DebouncedCallback();
    private debouncedChanged = new DebouncedCallback(100);

    private onReceiveClients = (clients: TeamspeakConnectClient[]) => {
        this.debouncedUpdate.schedule(() => {
            this.updateClients(clients);
        });
    };

    constructor(
        private teamspeakConnectService: TeamspeakConnectService,
        private formBuilder: FormBuilder,
        public dialog: MatDialog,
        private accountService: AccountService,
        private signalrService: SignalRService
    ) {}

    ngOnInit(): void {
        this.findTeamspeakClients();
        this.hubConnection = this.signalrService.connect('teamspeakClients');
        this.hubConnection.connection.on('ReceiveClients', this.onReceiveClients);
        this.hubConnection.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.debouncedUpdate.schedule(() => {
                    this.findTeamspeakClients();
                });
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.debouncedUpdate.cancel();
        this.debouncedChanged.cancel();
        this.hubConnection.connection.off('ReceiveClients', this.onReceiveClients);
        this.hubConnection.connection.stop();
    }

    findTeamspeakClients() {
        this.teamspeakConnectService.getOnlineClients().pipe(first()).subscribe({
            next: (clients) => {
                this.updateClients(clients);
            }
        });
    }

    updateClients(clients: TeamspeakConnectClient[]) {
        if (this.previousResponse !== JSON.stringify(clients)) {
            this.clients = clients;
            const tsIds = this.accountService.account.teamspeakIdentities;
            if (tsIds && tsIds.length > 0) {
                this.clients.forEach((client) => {
                    if (tsIds.indexOf(client.clientDbId) !== -1) {
                        client.clientName = `${client.clientName} (Already connected to this account)`;
                        client.connectedToAccount = true;
                    }
                });
            }
            this.previousResponse = JSON.stringify(this.clients);
        }
    }

    cancel() {
        this.cancelEvent.emit();
    }

    confirmed() {
        this.confirmedEvent.emit();
    }

    requestCode() {
        this.teamspeakConnectService.requestCode(this.teamspeakForm.value.teamspeakId).pipe(first()).subscribe({
            next: () => {
                this.state = 1;
            }
        });
    }

    changed(code: string) {
        if (this.pending) {
            return;
        }

        nextFrame(() => {
            this.debouncedChanged.schedule(() => {
                this.validateCode(code);
            });
        });
    }

    validateCode(code: string) {
        const sanitisedCode = code.trim();
        if (sanitisedCode.length !== 24) {
            return;
        }

        this.pending = true;
        this.teamspeakConnectService
            .connectTeamspeak(this.accountService.account.id, this.teamspeakForm.value.teamspeakId, sanitisedCode)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.pending = false;
                    this.connectedEvent.emit();
                    this.state = 2;
                },
                error: (error: UksfError) => {
                    this.errorMessage = error.error;
                    this.state = 3;
                    this.formGroup.controls.code.setValue('');
                    this.pending = false;
                }
            });
    }

    isConnectedToAccount(client: TeamspeakConnectClient): boolean {
        return client.connected && client.connectedToAccount;
    }

    isConnected(client: TeamspeakConnectClient): boolean {
        return client.connected && !this.isConnectedToAccount(client);
    }

    trackByClientDbId(index: number, client: TeamspeakConnectClient): number {
        return client.clientDbId;
    }

    getTooltip(client: TeamspeakConnectClient): string {
        if (this.isConnectedToAccount(client)) {
            return 'This user is already connected to your account';
        }

        if (this.isConnected(client)) {
            return 'This user is already connected to another account';
        }

        return 'This user is not connected to any account';
    }

}
