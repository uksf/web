import { Component, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { MatDialog } from '@angular/material';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { AccountService } from 'app/Services/account.service';
import { SignalRService, ConnectionContainer } from 'app/Services/signalr.service';

@Component({
    selector: 'app-teamspeak-connect',
    templateUrl: './teamspeak-connect.component.html',
    styleUrls: ['./teamspeak-connect.component.scss']
})
export class ConnectTeamspeakComponent {
    @Output() connectedEvent = new EventEmitter();
    formGroup: FormGroup;
    teamspeakForm: FormGroup;
    pending = false;
    sent = false;
    clients = [];
    private previousResponse = '-1';
    private data;
    private hubConnection: ConnectionContainer;

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
        this.teamspeakForm = formBuilder.group({
            teamspeakId: ['', Validators.required]
        }, {});
    }

    ngOnInit(): void {
        this.findTeamspeakClients();
        this.hubConnection = this.signalrService.connect(`teamspeakClients?userId=${this.accountService.account.id}`);
        this.hubConnection.connection.on('ReceiveClients', (clients) => {
            this.updateClients(clients);
        });
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.findTeamspeakClients();
        });
    }

    ngOnDestroy(): void {
        this.hubConnection.connection.stop();
    }

    findTeamspeakClients() {
        this.httpClient.get(this.urls.apiUrl + '/teamspeak/online').subscribe(
            response => {
                let clients = response['clients'];
                if (!clients) {
                    clients = [];
                }
                this.updateClients(clients);
            }, error => this.urls.errorWrapper('Failed to find teamspeak client', error)
        );
    }

    updateClients(clients) {
        if (this.previousResponse !== JSON.stringify(clients)) {
            this.clients = clients;
            const tsIds: Array<string> = this.accountService.account.teamspeakIdentities;
            if (tsIds.length > 0) {
                this.clients.forEach(client => {
                    if (tsIds.indexOf(client.clientDbId) !== -1) {
                        client.name = `${client.name} (Already connected to this account)`;
                    }
                });
            }
            this.previousResponse = JSON.stringify(this.clients);
        }
    }

    sendCode() {
        this.data = this.teamspeakForm.value.teamspeakId;
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.httpClient.post(this.urls.apiUrl + '/communications/send', {
            mode: 'teamspeak',
            data: this.data
        }, { headers: headers }).subscribe(() => {
            this.sent = true;
        });
    }

    changed(code) {
        setTimeout(() => {
            if (this.pending) { return; }
            this.validateCode(code);
        }, 1);
    }

    validateCode(code) {
        this.pending = true;
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.httpClient.post(this.urls.apiUrl + '/communications/receive', {
            id: this.accountService.account.id,
            mode: 'teamspeak',
            data: this.data,
            code: code
        }, { headers: headers }).subscribe(() => {
            this.pending = false;
            this.dialog.open(MessageModalComponent, {
                data: { message: 'Teamspeak successfully connected' }
            }).afterClosed().subscribe(() => {
                this.connectedEvent.emit();
            });
        }, error => {
            this.pending = false;
            this.formGroup.controls['code'].setValue('');
            this.dialog.open(MessageModalComponent, {
                data: { message: error.error.error }
            });
        });
    }
}
