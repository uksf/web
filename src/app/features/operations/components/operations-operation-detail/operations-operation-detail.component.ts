import { Component, HostListener, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxPermissionsModule } from 'ngx-permissions';
import { QuillViewComponent } from 'ngx-quill';
import { first } from 'rxjs/operators';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { mapBorderColour, capitaliseMapName, mapTokenFromMission } from '../../utils/map-colour';
import { Campaign, CampaignMission, CampaignMissionDto, CampaignMissionStatus, CampaignStatus, IntelPage, IntelScope, MissionFileState, Operation, OperationStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';
import { IntelModalComponent } from '../../modals/intel-modal/intel-modal.component';
import { MissionModalComponent } from '../../modals/mission-modal/mission-modal.component';
import { OperationModalComponent } from '../../modals/operation-modal/operation-modal.component';

@Component({
    selector: 'app-operations-operation-detail',
    templateUrl: './operations-operation-detail.component.html',
    styleUrls: ['../operations-detail-chrome.scss', '../operations-detail-cards.scss', './operations-operation-detail.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        FullContentAreaComponent,
        RouterLink,
        MatIcon,
        MatButton,
        MatAnchor,
        MatIconButton,
        MatTooltip,
        DatePipe,
        QuillViewComponent,
        NgxPermissionsModule
    ]
})
export class OperationsOperationDetailComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private campaignsService = inject(CampaignsService);
    private dialog = inject(MatDialog);

    readonly CampaignMissionStatus = CampaignMissionStatus;
    readonly MissionFileState = MissionFileState;
    readonly CampaignStatus = CampaignStatus;
    readonly OperationStatus = OperationStatus;

    campaignId = '';
    operationId = '';
    campaign?: Campaign;
    operation?: Operation;
    missions: CampaignMissionDto[] = [];
    intel: IntelPage[] = [];
    missing = false;

    shiftHeld = false;

    @HostListener('window:keydown', ['$event'])
    @HostListener('window:keyup', ['$event'])
    onKey(event: KeyboardEvent) {
        this.shiftHeld = event.shiftKey;
    }

    get isPastCampaign(): boolean {
        return this.campaign?.status === CampaignStatus.Past;
    }

    get statusLabel(): string {
        switch (this.operation?.status) {
            case OperationStatus.Current:
                return 'Current';
            case OperationStatus.Upcoming:
                return 'Upcoming';
            default:
                return 'Past';
        }
    }

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('campaignId') ?? '';
        this.operationId = this.route.snapshot.paramMap.get('operationId') ?? '';
        this.load();
    }

    load() {
        this.campaignsService.getCampaign(this.campaignId).pipe(first()).subscribe({ next: (c) => (this.campaign = c) });
        this.campaignsService.getOperation(this.campaignId, this.operationId).pipe(first()).subscribe({
            next: (operation) => (this.operation = operation),
            error: () => (this.missing = true)
        });
        this.campaignsService.getMissions(this.campaignId, this.operationId).pipe(first()).subscribe({ next: (missions) => (this.missions = missions) });
        this.campaignsService.getIntel(IntelScope.Operation, this.operationId).pipe(first()).subscribe({ next: (intel) => (this.intel = intel) });
    }

    mapColour(mission: CampaignMission): string {
        return mapBorderColour(mapTokenFromMission(mission.missionName));
    }

    mapName(mission: CampaignMission): string {
        return capitaliseMapName(mapTokenFromMission(mission.missionName));
    }

    isLaunchDisabled(dto: CampaignMissionDto): boolean {
        return dto.mission.autoLaunch && !this.shiftHeld;
    }

    launchIcon(dto: CampaignMissionDto): string {
        return dto.mission.autoLaunch && !this.shiftHeld ? 'schedule' : 'play_arrow';
    }

    launchTooltip(dto: CampaignMissionDto): string {
        return dto.mission.autoLaunch && !this.shiftHeld ? 'This mission is scheduled to launch automatically. Hold shift to launch now.' : 'Launch';
    }

    launch(dto: CampaignMissionDto) {
        this.campaignsService
            .launchMission(this.campaignId, this.operationId, dto.mission.id)
            .pipe(first())
            .subscribe({
                next: (reports) => {
                    if (reports && reports.length > 0) {
                        this.dialog.open(MessageModalComponent, {
                            data: { title: 'Mission patched with warnings', message: reports.map((r) => r.detail ?? r.title ?? JSON.stringify(r)).join('\n') }
                        });
                    }
                    this.load();
                },
                error: (error) => this.dialog.open(MessageModalComponent, { data: { message: error?.error ?? 'Launch failed' } })
            });
    }

    createIntel() {
        this.dialog
            .open(IntelModalComponent, { data: { scope: IntelScope.Operation, ownerId: this.operationId } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (saved) => saved && this.load() });
    }

    createMission() {
        this.dialog
            .open(MissionModalComponent, { data: { campaignId: this.campaignId, operationId: this.operationId } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (saved) => saved && this.load() });
    }

    editOperation() {
        if (!this.operation) { return; }
        this.dialog
            .open(OperationModalComponent, { data: { campaignId: this.campaignId, operation: this.operation } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (saved) => saved && this.load() });
    }

    deleteOperation() {
        if (!this.operation) { return; }
        this.dialog
            .open(ConfirmationModalComponent, { data: { title: 'Delete operation', message: `Delete "${this.operation.title}" and all its missions? This cannot be undone.`, button: 'Delete' } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (confirmed) => confirmed && this.campaignsService.deleteOperation(this.campaignId, this.operationId).pipe(first()).subscribe({ next: () => this.router.navigate(['/operations/campaigns', this.campaignId]) }) });
    }

    openMission(dto: CampaignMissionDto) {
        this.router.navigate(['missions', dto.mission.id], { relativeTo: this.route });
    }

    editMission(dto: CampaignMissionDto) {
        this.dialog
            .open(MissionModalComponent, { data: { campaignId: this.campaignId, operationId: this.operationId, mission: dto.mission } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (saved) => saved && this.load() });
    }

    deleteMission(dto: CampaignMissionDto) {
        this.dialog
            .open(ConfirmationModalComponent, { data: { title: 'Delete mission', message: `Delete "${dto.mission.title}"?`, button: 'Delete' } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (confirmed) => confirmed && this.campaignsService.deleteMission(this.campaignId, this.operationId, dto.mission.id).pipe(first()).subscribe({ next: () => this.load() }) });
    }

    openIntel(page: IntelPage) {
        this.router.navigate(['intel', page.id], { relativeTo: this.route });
    }

    deleteIntel(page: IntelPage) {
        this.dialog
            .open(ConfirmationModalComponent, { data: { title: 'Delete intel page', message: `Delete "${page.title}"?`, button: 'Delete' } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (confirmed) => confirmed && this.campaignsService.deleteIntel(page.id).pipe(first()).subscribe({ next: () => this.load() }) });
    }
}
