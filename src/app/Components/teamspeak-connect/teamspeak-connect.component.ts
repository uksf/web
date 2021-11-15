import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { AccountService } from 'app/Services/account.service';
import { SignalRService, ConnectionContainer } from 'app/Services/signalr.service';
import { nextFrame } from 'app/Services/helper.service';
import { UksfError } from '../../Models/Response';
import { TeamspeakConnectClient } from '../../Models/TeamspeakConnectClient';

@Component({
    selector: 'app-teamspeak-connect',
    templateUrl: './teamspeak-connect.component.html',
    styleUrls: ['./teamspeak-connect.component.scss']
})
export class ConnectTeamspeakComponent {
    @Input() showCancel = false;
    @Output() connectedEvent = new EventEmitter();
    @Output() confirmedEvent = new EventEmitter();
    @Output() cancelEvent = new EventEmitter();
    formGroup: FormGroup;
    teamspeakForm: FormGroup;
    pending = false;
    state = 0;
    clients: TeamspeakConnectClient[] = [];
    errorMessage: string = 'Unknown error. Please try again';
    private previousResponse = '-1';
    private hubConnection: ConnectionContainer;
    private updateTimeout: NodeJS.Timeout;
    private changedTimeout: NodeJS.Timeout;

    constructor(
        private httpClient: HttpClient,
        public formBuilder: FormBuilder,
        private urls: UrlService,
        public dialog: MatDialog,
        private accountService: AccountService,
        private signalrService: SignalRService
    ) {
        this.formGroup = formBuilder.group({
            code: ['', Validators.required]
        });
        this.teamspeakForm = formBuilder.group(
            {
                teamspeakId: ['', Validators.required]
            },
            {}
        );
    }

    ngOnInit(): void {
        this.findTeamspeakClients();
        this.hubConnection = this.signalrService.connect('teamspeakClients');
        this.hubConnection.connection.on('ReceiveClients', (clients) => {
            this.mergeUpdates(() => {
                this.updateClients(clients);
            });
        });
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.mergeUpdates(() => {
                this.findTeamspeakClients();
            });
        });
    }

    ngOnDestroy(): void {
        this.hubConnection.connection.stop();
    }

    private mergeUpdates(callback: () => void) {
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(() => {
            callback();
        }, 500);
    }

    findTeamspeakClients() {
        this.httpClient.get(this.urls.apiUrl + '/teamspeak/online').subscribe((clients: TeamspeakConnectClient[]) => {
            this.updateClients(clients);
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
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.httpClient.get(this.urls.apiUrl + `/teamspeak/${this.teamspeakForm.value.teamspeakId}`, { headers: headers }).subscribe(() => {
            this.state = 1;
        });
    }

    changed(code: string) {
        if (this.pending) {
            return;
        }

        nextFrame(() => {
            this.mergeChanged(() => {
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
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.httpClient
            .post(
                this.urls.apiUrl + `/accounts/${this.accountService.account.id}/teamspeak/${this.teamspeakForm.value.teamspeakId}`,
                {
                    code: sanitisedCode
                },
                { headers: headers }
            )
            .subscribe({
                next: () => {
                    this.pending = false;
                    this.connectedEvent.emit();
                    this.state = 2;
                },
                error: (error: UksfError) => {
                    this.errorMessage = error.error;
                    this.state = 3;
                    this.formGroup.controls['code'].setValue('');
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

    getTooltip(client: TeamspeakConnectClient): string {
        if (this.isConnectedToAccount(client)) {
            return 'This user is already connected to your account';
        }

        if (this.isConnected(client)) {
            return 'This user is already connected to another account';
        }

        return 'This user is not connected to any account';
    }

    private mergeChanged(callback: () => void) {
        if (this.changedTimeout) {
            clearTimeout(this.changedTimeout);
        }
        this.changedTimeout = setTimeout(() => {
            callback();
        }, 100);
    }
}
