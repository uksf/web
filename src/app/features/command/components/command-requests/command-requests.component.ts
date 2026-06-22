import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { Subject } from 'rxjs';
import { first, switchMap, takeUntil } from 'rxjs/operators';
import { RequestRankModalComponent } from '@app/features/command/modals/request-rank-modal/request-rank-modal.component';
import { RequestTransferModalComponent } from '@app/features/command/modals/request-transfer-modal/request-transfer-modal.component';
import { RequestRoleModalComponent } from '@app/features/command/modals/request-role-modal/request-role-modal.component';
import { RequestChainOfCommandPositionModalComponent } from '@app/features/command/modals/request-chain-of-command-position-modal/request-chain-of-command-position-modal.component';
import { RequestDischargeModalComponent } from '@app/features/command/modals/request-discharge-modal/request-discharge-modal.component';
import { RequestUnitRemovalModalComponent } from '@app/features/command/modals/request-unit-removal-modal/request-unit-removal-modal.component';
import { RequestMedicAttachmentModalComponent } from '@app/features/command/modals/request-medic-attachment-modal/request-medic-attachment-modal.component';
import { CommandRequestsHubService } from '../../services/command-requests-hub.service';
import { CommandRequestsService } from '../../services/command-requests.service';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { RequestModalData } from '@app/shared/models/shared';
import { UnitBranch } from '@app/features/units/models/units';
import { CommandRequestItem, ReviewState } from '@app/features/command/models/command-request';
import { DestroyableComponent } from '@app/shared/components';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { CommandRequestCardComponent } from '../command-request-card/command-request-card.component';

@Component({
    selector: 'app-command-requests',
    templateUrl: './command-requests.component.html',
    styleUrls: ['./command-requests.component.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, MatButton, CommandRequestCardComponent]
})
export class CommandRequestsComponent extends DestroyableComponent implements OnInit, OnDestroy {
    private commandRequestsService = inject(CommandRequestsService);
    dialog = inject(MatDialog);
    private commandRequestsHub = inject(CommandRequestsHubService);

    myRequests: CommandRequestItem[] = [];
    otherRequests: CommandRequestItem[] = [];

    private refresh$ = new Subject<void>();
    private onReceiveRequestUpdate = () => this.refresh$.next();

    constructor() {
        super();
        this.refresh$
            .pipe(
                switchMap(() => this.commandRequestsService.getRequests()),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (response) => {
                    this.myRequests = response.myRequests;
                    this.otherRequests = response.otherRequests;
                }
            });
        this.refresh$.next();
    }

    ngOnInit() {
        this.commandRequestsHub.connect();
        this.commandRequestsHub.on('ReceiveRequestUpdate', this.onReceiveRequestUpdate);
        this.commandRequestsHub.reconnected$.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this.refresh$.next()
        });
    }

    override ngOnDestroy(): void {
        super.ngOnDestroy();
        this.commandRequestsHub.off('ReceiveRequestUpdate', this.onReceiveRequestUpdate);
        this.commandRequestsHub.disconnect();
    }

    getRequests() {
        this.refresh$.next();
    }

    setReview(request: CommandRequestItem, state: ReviewState, overridden: boolean) {
        this.commandRequestsService
            .setReview(request.data.id, state, overridden)
            .pipe(first())
            .subscribe({
                next: () => this.getRequests(),
                error: (error) => {
                    this.getRequests();
                    this.dialog.open(MessageModalComponent, { data: { message: error.error } });
                }
            });
    }

    rankRequest() {
        this.openCreateModal(RequestRankModalComponent);
    }

    roleRequest() {
        this.openCreateModal(RequestRoleModalComponent);
    }

    chainOfCommandPositionRequest() {
        this.openCreateModal(RequestChainOfCommandPositionModalComponent);
    }

    unitRemovalRequest() {
        this.openCreateModal(RequestUnitRemovalModalComponent);
    }

    dischargeRequest() {
        this.openCreateModal(RequestDischargeModalComponent);
    }

    transferRequest() {
        const data: RequestModalData = {
            ids: [],
            allowedBranches: [UnitBranch.COMBAT, UnitBranch.AUXILIARY, UnitBranch.SECONDARY]
        };
        this.dialog
            .open(RequestTransferModalComponent, { data })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: () => this.getRequests() });
    }

    medicAttachmentRequest() {
        const data: RequestModalData = { ids: [] };
        this.dialog
            .open(RequestMedicAttachmentModalComponent, { data })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: () => this.getRequests() });
    }

    private openCreateModal(component: unknown) {
        this.dialog
            .open(component as never)
            .afterClosed()
            .pipe(first())
            .subscribe({ next: () => this.getRequests() });
    }
}
