import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Account } from '@app/shared/models/account';
import { expansionAnimations } from '@app/shared/services/animations.service';
import { MatDialog } from '@angular/material/dialog';
import { RequestRankModalComponent } from '@app/features/command/modals/request-rank-modal/request-rank-modal.component';
import { RequestRoleModalComponent } from '@app/features/command/modals/request-role-modal/request-role-modal.component';
import { RequestTransferModalComponent } from '@app/features/command/modals/request-transfer-modal/request-transfer-modal.component';
import { RequestModalData } from '@app/shared/models/shared';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { EditMemberTrainingModalData } from '@app/features/command/models/training';
import { EditMemberTrainingModalComponent } from '@app/features/command/modals/edit-member-training-modal/edit-member-training-modal.component';
import { UnitBranch } from '@app/features/units/models/units';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-command-member-card',
    templateUrl: './command-member-card.component.html',
    styleUrls: ['./command-member-card.component.scss'],
    animations: [expansionAnimations.indicatorRotate, expansionAnimations.bodyExpansion]
})
export class CommandMemberCardComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    @Input('member') member: Account;
    expanded: boolean = false;
    hover: boolean = false;
    qualificationsPending: boolean = false;

    constructor(private dialog: MatDialog, private httpClient: HttpClient, private urls: UrlService) {}

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    editRank() {
        const data: RequestModalData = {
            ids: [this.member.id]
        };
        this.dialog.open(RequestRankModalComponent, {
            data: data
        });
    }

    editRole() {
        const data: RequestModalData = {
            ids: [this.member.id]
        };
        this.dialog.open(RequestRoleModalComponent, {
            data: data
        });
    }

    editUnit() {
        const data: RequestModalData = {
            ids: [this.member.id],
            allowedBranches: [UnitBranch.COMBAT, UnitBranch.AUXILIARY, UnitBranch.SECONDARY]
        };
        this.dialog.open(RequestTransferModalComponent, {
            data: data
        });
    }

    updateQualifications() {
        this.qualificationsPending = true;
        this.httpClient.put(`${this.urls.apiUrl}/accounts/${this.member.id}/qualifications`, this.member.qualifications).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.qualificationsPending = false;
            },
            error: () => {
                this.qualificationsPending = false;
            }
        });
    }

    editTraining() {
        const data: EditMemberTrainingModalData = {
            accountId: this.member.id,
            name: `${this.member.lastname}.${this.member.firstname[0]}`,
            trainings: this.member.trainings
        };
        this.dialog.open(EditMemberTrainingModalComponent, {
            data: data
        });
    }

    toggle(event) {
        this.expanded = !this.expanded;

        event.stopPropagation();
    }

    onMouseOver() {
        this.hover = true;
    }

    onMouseLeave() {
        this.hover = false;
    }

    get toggleState(): string {
        return this.expanded ? 'expanded' : 'collapsed';
    }

    trackByUnitId(index: number, unit: any): string {
        return unit.id;
    }

    trackByName(index: number, item: any): string {
        return item.name;
    }

    get displayName(): string {
        return `${this.member.lastname}.${this.member.firstname[0]}`;
    }
}
