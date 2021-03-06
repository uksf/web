import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { AccountService } from 'app/Services/account.service';
import { SignalRService, ConnectionContainer } from 'app/Services/signalr.service';
import { nextFrame } from 'app/Services/helper.service';
import { ErrorResponse, UksfError } from '../../Models/Response';

@Component({
    selector: 'app-teamspeak-connect',
    templateUrl: './teamspeak-connect.component.html',
    styleUrls: ['./teamspeak-connect.component.scss'],
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
    clients = [];
    errorMessage: string = 'Unknown error. Plase try again';
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
            code: ['', Validators.required],
        });
        this.teamspeakForm = formBuilder.group(
            {
                teamspeakId: ['', Validators.required],
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
        this.httpClient.get(this.urls.apiUrl + '/teamspeak/online').subscribe((response: any[]) => {
            this.updateClients(response);
        });
    }

    updateClients(clients: any[]) {
        if (this.previousResponse !== JSON.stringify(clients)) {
            this.clients = clients;
            const tsIds = this.accountService.account.teamspeakIdentities;
            if (tsIds && tsIds.length > 0) {
                this.clients.forEach((client) => {
                    if (tsIds.indexOf(client.clientDbId) !== -1) {
                        client.name = `${client.name} (Already connected to this account)`;
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
        if (this.pending || code.length < 24 || code.length > 24) {
            return;
        }
        nextFrame(() => {
            this.mergeChanged(() => {
                this.validateCode(code);
            });
        });
    }

    private mergeChanged(callback: () => void) {
        if (this.changedTimeout) {
            clearTimeout(this.changedTimeout);
        }
        this.changedTimeout = setTimeout(() => {
            callback();
        }, 100);
    }

    validateCode(code: string) {
        this.pending = true;
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        this.httpClient
            .post(
                this.urls.apiUrl + `/accounts/${this.accountService.account.id}/teamspeak/${this.teamspeakForm.value.teamspeakId}`,
                {
                    code: code,
                },
                { headers: headers }
            )
            .subscribe(
                () => {
                    this.pending = false;
                    this.connectedEvent.emit();
                    this.state = 2;
                },
                (error: UksfError) => {
                    this.errorMessage = error.error;
                    this.state = 3;
                    this.formGroup.controls['code'].setValue('');
                    this.pending = false;
                }
            );
    }
}
