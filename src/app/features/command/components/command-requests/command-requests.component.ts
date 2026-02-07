import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { UrlService } from '@app/core/services/url.service';
import { RequestRankModalComponent } from '@app/features/command/modals/request-rank-modal/request-rank-modal.component';
import { RequestTransferModalComponent } from '@app/features/command/modals/request-transfer-modal/request-transfer-modal.component';
import { RequestRoleModalComponent } from '@app/features/command/modals/request-role-modal/request-role-modal.component';
import { RequestChainOfCommandPositionModalComponent } from '@app/features/command/modals/request-chain-of-command-position-modal/request-chain-of-command-position-modal.component';
import { RequestDischargeModalComponent } from '@app/features/command/modals/request-discharge-modal/request-discharge-modal.component';
import { RequestUnitRemovalModalComponent } from '@app/features/command/modals/request-unit-removal-modal/request-unit-removal-modal.component';
import { ConnectionContainer, SignalRService } from '@app/core/services/signalr.service';
import { AccountService } from '@app/core/services/account.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { RequestModalData } from '@app/shared/models/shared';
import { UnitBranch } from '@app/features/units/models/units';
import { CommandRequestItem, CommandRequestReview, CommandRequestsResponse } from '@app/features/command/models/command-request';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-command-requests',
    templateUrl: './command-requests.component.html',
    styleUrls: ['../command-page/command-page.component.scss', './command-requests.component.scss']
})
export class CommandRequestsComponent implements OnInit, OnDestroy {
    reviewState = ReviewState;
    myRequests: CommandRequestItem[] = [];
    otherRequests: CommandRequestItem[] = [];
    updating;
    private hubConnection: ConnectionContainer;
    private destroy$ = new Subject<void>();

    private onReceiveRequestUpdate = () => {
        this.getRequests();
    };

    constructor(private httpClient: HttpClient, private urls: UrlService, public dialog: MatDialog, private signalrService: SignalRService, private accountService: AccountService) {
        this.getRequests();
    }

    ngOnInit() {
        this.hubConnection = this.signalrService.connect(`commandRequests`);
        this.hubConnection.connection.on('ReceiveRequestUpdate', this.onReceiveRequestUpdate);
        this.hubConnection.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getRequests();
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.hubConnection.connection.off('ReceiveRequestUpdate', this.onReceiveRequestUpdate);
        this.hubConnection.connection.stop();
    }

    getRequests() {
        this.updating = true;
        this.httpClient.get<CommandRequestsResponse>(`${this.urls.apiUrl}/commandrequests`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                this.myRequests = response.myRequests;
                this.otherRequests = response.otherRequests;
                this.updating = false;
            },
            error: (_) => {
                this.updating = false;
            }
        });
    }

    isLoa(request) {
        return request.data.type === 'Loa';
    }

    canReview(request): boolean {
        return request.reviews.some((review) => review.id === this.accountService.account.id && review.state === ReviewState.PENDING);
    }

    setReview(request, reviewState, overriden) {
        request.updating = true;
        request.reviewState = reviewState;
        request.reviewOverriden = overriden;
        this.httpClient
            .patch(
                this.urls.apiUrl + '/commandrequests/' + request.data.id,
                { reviewState: reviewState, overriden: overriden },
                {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json'
                    })
                }
            )
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (_) => this.getRequests(),
                error: (error) => {
                    this.getRequests();
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                }
            });
    }

    transferRequest(): void {
        const data: RequestModalData = {
            ids: [],
            allowedBranches: [UnitBranch.COMBAT, UnitBranch.AUXILIARY, UnitBranch.SECONDARY]
        };
        const dialog = this.dialog.open(RequestTransferModalComponent, {
            data: data
        });
        dialog.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
            next: (_) => {
                this.getRequests();
            }
        });
    }

    rankRequest(): void {
        const dialog = this.dialog.open(RequestRankModalComponent, {});
        dialog.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
            next: (_) => {
                this.getRequests();
            }
        });
    }

    roleRequest(): void {
        const dialog = this.dialog.open(RequestRoleModalComponent, {});
        dialog.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
            next: (_) => {
                this.getRequests();
            }
        });
    }

    chainOfCommandPositionRequest() {
        const dialog = this.dialog.open(RequestChainOfCommandPositionModalComponent, {});
        dialog.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
            next: (_) => {
                this.getRequests();
            }
        });
    }

    unitRemovalRequest() {
        const dialog = this.dialog.open(RequestUnitRemovalModalComponent, {});
        dialog.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
            next: (_) => {
                this.getRequests();
            }
        });
    }

    trackByRequestId(index: number, request: { data: { id: string } }): string {
        return request.data.id;
    }

    trackByReviewId(index: number, review: CommandRequestReview): string {
        return review.id;
    }

    dischargeRequest() {
        const dialog = this.dialog.open(RequestDischargeModalComponent, {});
        dialog.afterClosed().pipe(takeUntil(this.destroy$)).subscribe({
            next: (_) => {
                this.getRequests();
            }
        });
    }
}

export enum ReviewState {
    APPROVED,
    REJECTED,
    PENDING
}
