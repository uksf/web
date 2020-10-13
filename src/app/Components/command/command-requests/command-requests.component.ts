import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { UrlService } from '../../../Services/url.service';
import { RequestRankModalComponent } from '../../../Modals/command/request-rank-modal/request-rank-modal.component';
import { RequestTransferModalComponent } from '../../../Modals/command/request-transfer-modal/request-transfer-modal.component';
import { RequestRoleModalComponent } from '../../../Modals/command/request-role-modal/request-role-modal.component';
import { RequestUnitRoleModalComponent } from '../../../Modals/command/request-unit-role-modal/request-unit-role-modal.component';
import { RequestDischargeModalComponent } from '../../../Modals/command/request-discharge-modal/request-discharge-modal.component';
import { RequestUnitRemovalModalComponent } from 'app/Modals/command/request-unit-removal-modal/request-unit-removal-modal.component';
import { SignalRService, ConnectionContainer } from 'app/Services/signalr.service';
import { AccountService } from 'app/Services/account.service';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-command-requests',
    templateUrl: './command-requests.component.html',
    styleUrls: ['../../../Pages/command-page/command-page.component.css', './command-requests.component.scss']
})
export class CommandRequestsComponent implements OnInit, OnDestroy {
    reviewState = ReviewState;
    myRequests = [];
    otherRequests = [];
    updating;
    private hubConnection: ConnectionContainer;

    constructor(private httpClient: HttpClient, private urls: UrlService, public dialog: MatDialog, private signalrService: SignalRService, private accountService: AccountService) {
        this.getRequests();
    }

    ngOnInit() {
        this.hubConnection = this.signalrService.connect(`commandRequests`);
        this.hubConnection.connection.on('ReceiveRequestUpdate', _ => {
            this.getRequests();
        });
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.getRequests();
        });
    }

    ngOnDestroy() {
        this.hubConnection.connection.stop();
    }

    getRequests() {
        this.updating = true;
        this.httpClient.get(this.urls.apiUrl + '/commandrequests').subscribe(response => {
            this.myRequests = response['myRequests'];
            this.otherRequests = response['otherRequests'];
            this.updating = false;
        }, _ => {
            this.updating = false;
        });
    }

    isDate(date) {
        return !isNaN(Date.parse(date));
    }

    canReview(request): boolean {
        return request.reviews.some(review => review.id === this.accountService.account.id && review.state === ReviewState.PENDING);
    }

    setReview(request, reviewState, overriden) {
        request.updating = true;
        request.reviewState = reviewState;
        request.reviewOverriden = overriden;
        this.httpClient.patch(this.urls.apiUrl + '/commandrequests/' + request.data.id, { reviewState: reviewState, overriden: overriden }, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(_ => this.getRequests(), error => {
            this.getRequests();
            this.dialog.open(MessageModalComponent, {
                data: { message: error.error }
            });
        });
    }

    transferRequest(): void {
        const dialog = this.dialog.open(RequestTransferModalComponent, {});
        dialog.afterClosed().subscribe(_ => {
            this.getRequests();
        });
    }

    rankRequest(): void {
        const dialog = this.dialog.open(RequestRankModalComponent, {});
        dialog.afterClosed().subscribe(_ => {
            this.getRequests();
        });
    }

    roleRequest(): void {
        const dialog = this.dialog.open(RequestRoleModalComponent, {});
        dialog.afterClosed().subscribe(_ => {
            this.getRequests();
        });
    }

    unitRoleRequest() {
        const dialog = this.dialog.open(RequestUnitRoleModalComponent, {});
        dialog.afterClosed().subscribe(_ => {
            this.getRequests();
        });
    }

    unitRemovalRequest() {
        const dialog = this.dialog.open(RequestUnitRemovalModalComponent, {});
        dialog.afterClosed().subscribe(_ => {
            this.getRequests();
        });
    }

    dischargeRequest() {
        const dialog = this.dialog.open(RequestDischargeModalComponent, {});
        dialog.afterClosed().subscribe(_ => {
            this.getRequests();
        });
    }
}

export enum ReviewState {
    APPROVED,
    REJECTED,
    PENDING
}
