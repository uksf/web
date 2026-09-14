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
import { capitaliseMapName, mapBorderColour, mapTokenFromMission } from '../../utils/map-colour';
import { Campaign, CampaignMissionDto, CampaignMissionStatus, CampaignStatus, IntelPage, IntelScope, MissionFileState, Operation } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';
import { GameServersService } from '../../services/game-servers.service';
import { MissionModalComponent } from '../../modals/mission-modal/mission-modal.component';

@Component({
    selector: 'app-operations-mission-detail',
    templateUrl: './operations-mission-detail.component.html',
    styleUrls: ['../operations-detail-chrome.scss', '../operations-detail-cards.scss', './operations-mission-detail.component.scss'],
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
export class OperationsMissionDetailComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private campaignsService = inject(CampaignsService);
    private gameServersService = inject(GameServersService);
    private dialog = inject(MatDialog);

    readonly CampaignMissionStatus = CampaignMissionStatus;
    readonly MissionFileState = MissionFileState;
    readonly CampaignStatus = CampaignStatus;

    campaignId = '';
    operationId = '';
    missionId = '';
    campaign?: Campaign;
    operation?: Operation;
    dto?: CampaignMissionDto;
    intel: IntelPage[] = [];
    missing = false;
    private serverNames: Record<string, string> = {};

    shiftHeld = false;

    @HostListener('window:keydown', ['$event'])
    @HostListener('window:keyup', ['$event'])
    onKey(event: KeyboardEvent) {
        this.shiftHeld = event.shiftKey;
    }

    get isPastCampaign(): boolean {
        return this.campaign?.status === CampaignStatus.Past;
    }

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('campaignId') ?? '';
        this.operationId = this.route.snapshot.paramMap.get('operationId') ?? '';
        this.missionId = this.route.snapshot.paramMap.get('missionId') ?? '';
        this.gameServersService
            .getServers()
            .pipe(first())
            .subscribe({ next: (update) => update.servers.forEach((s) => (this.serverNames[s.id] = s.name)) });
        this.load();
    }

    load() {
        this.campaignsService.getMission(this.campaignId, this.operationId, this.missionId).pipe(first()).subscribe({
            next: (dto) => (this.dto = dto),
            error: () => (this.missing = true)
        });
        this.campaignsService.getCampaign(this.campaignId).pipe(first()).subscribe({ next: (c) => (this.campaign = c) });
        this.campaignsService.getOperation(this.campaignId, this.operationId).pipe(first()).subscribe({ next: (operation) => (this.operation = operation) });
        this.campaignsService.getIntel(IntelScope.Mission, this.missionId).pipe(first()).subscribe({ next: (intel) => (this.intel = intel) });
    }

    get serverName(): string {
        const id = this.dto?.mission.serverId;
        return id ? (this.serverNames[id] ?? id) : '';
    }

    get stripe(): string {
        return this.dto ? mapBorderColour(mapTokenFromMission(this.dto.mission.missionName)) : '';
    }

    get mapName(): string {
        return capitaliseMapName(mapTokenFromMission(this.dto?.mission.missionName));
    }

    get isLaunchDisabled(): boolean {
        return !!this.dto?.mission.autoLaunch && !this.shiftHeld;
    }

    get launchIcon(): string {
        return this.dto?.mission.autoLaunch && !this.shiftHeld ? 'schedule' : 'play_arrow';
    }

    get launchTooltip(): string {
        return this.dto?.mission.autoLaunch && !this.shiftHeld ? 'This mission is scheduled to launch automatically. Hold shift to launch now.' : 'Launch';
    }

    launch() {
        if (!this.dto) {
            return;
        }
        this.campaignsService
            .launchMission(this.campaignId, this.operationId, this.dto.mission.id)
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
        this.router.navigate(['/operations/campaigns', this.campaignId, 'operations', this.operationId, 'missions', this.missionId, 'intel', 'new']);
    }

    editMission() {
        if (!this.dto) { return; }
        this.dialog
            .open(MissionModalComponent, { data: { campaignId: this.campaignId, operationId: this.operationId, mission: this.dto.mission } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (saved) => saved && this.load() });
    }

    deleteMission() {
        if (!this.dto) { return; }
        this.dialog
            .open(ConfirmationModalComponent, { data: { title: 'Delete mission', message: `Delete "${this.dto.mission.title}"? This cannot be undone.`, button: 'Delete' } })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (confirmed) => {
                    if (confirmed) {
                        this.campaignsService.deleteMission(this.campaignId, this.operationId, this.missionId).pipe(first()).subscribe({
                            next: () => this.router.navigate(['/operations/campaigns', this.campaignId, 'operations', this.operationId])
                        });
                    }
                }
            });
    }

    openWarno() {
        this.router.navigate(['warno'], { relativeTo: this.route });
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
