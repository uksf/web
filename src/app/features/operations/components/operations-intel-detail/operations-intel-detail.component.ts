import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxPermissionsModule } from 'ngx-permissions';
import { QuillViewComponent } from 'ngx-quill';
import { forkJoin, of } from 'rxjs';
import { first, switchMap, tap } from 'rxjs/operators';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { Campaign, CampaignMissionDto, IntelPage, IntelScope, Operation } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';

@Component({
    selector: 'app-operations-intel-detail',
    templateUrl: './operations-intel-detail.component.html',
    styleUrls: ['./operations-intel-detail.component.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, RouterLink, MatIcon, MatButton, MatIconButton, MatTooltip, QuillViewComponent, NgxPermissionsModule]
})
export class OperationsIntelDetailComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private campaignsService = inject(CampaignsService);
    private dialog = inject(MatDialog);

    campaignId = '';
    operationId: string | null = null;
    missionId: string | null = null;
    intelId = '';
    campaign?: Campaign;
    operation?: Operation;
    mission?: CampaignMissionDto;
    page?: IntelPage;
    loaded = false;
    missing = false;

    get backLink(): string[] {
        if (this.missionId && this.operationId) {
            return ['/operations/campaigns', this.campaignId, 'operations', this.operationId, 'missions', this.missionId];
        }
        if (this.operationId) {
            return ['/operations/campaigns', this.campaignId, 'operations', this.operationId];
        }
        return ['/operations/campaigns', this.campaignId];
    }

    get backLabel(): string {
        if (this.missionId) {
            return this.mission?.mission.title ?? '';
        }
        if (this.operationId) {
            return this.operation?.title ?? '';
        }
        return this.campaign?.name ?? '';
    }

    get ancestry(): string {
        return [this.campaign?.name, this.operation?.title, this.mission?.mission.title].filter(Boolean).join(' / ');
    }

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('campaignId') ?? '';
        this.operationId = this.route.snapshot.paramMap.get('operationId');
        this.missionId = this.route.snapshot.paramMap.get('missionId');
        this.intelId = this.route.snapshot.paramMap.get('intelId') ?? '';
        this.load();
    }

    load() {
        this.loaded = false;
        this.missing = false;
        this.page = undefined;
        const scope = this.missionId ? IntelScope.Mission : this.operationId ? IntelScope.Operation : IntelScope.Campaign;
        const ownerId = this.missionId ?? this.operationId ?? this.campaignId;
        forkJoin({
            campaign: this.campaignsService.getCampaign(this.campaignId).pipe(tap((c) => (this.campaign = c))),
            operation: this.operationId
                ? this.campaignsService.getOperation(this.campaignId, this.operationId).pipe(tap((operation) => (this.operation = operation)))
                : of(null),
            mission:
                this.missionId && this.operationId
                    ? this.campaignsService.getMission(this.campaignId, this.operationId, this.missionId).pipe(tap((dto) => (this.mission = dto)))
                    : of(null)
        })
            .pipe(
                switchMap(() => this.campaignsService.getIntel(scope, ownerId)),
                first()
            )
            .subscribe({
                next: (pages) => {
                    this.page = pages.find((p) => p.id === this.intelId);
                    this.loaded = true;
                },
                error: () => {
                    this.page = undefined;
                    this.missing = true;
                    this.loaded = true;
                }
            });
    }

    edit() {
        if (!this.page) {
            return;
        }
        this.router.navigate(['edit'], { relativeTo: this.route });
    }

    delete() {
        if (!this.page) {
            return;
        }
        this.dialog
            .open(ConfirmationModalComponent, { data: { title: 'Delete intel page', message: `Delete "${this.page.title}"?`, button: 'Delete' } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (confirmed) => confirmed && this.campaignsService.deleteIntel(this.page!.id).pipe(first()).subscribe({ next: () => this.router.navigate(this.backLink) }) });
    }
}
