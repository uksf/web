import { Component, inject } from '@angular/core';
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
import { Campaign, CampaignStatus, IntelPage, IntelScope, MissionFileState, OpDto, OpStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';
import { GameServersService } from '../../services/game-servers.service';
import { IntelModalComponent } from '../../modals/intel-modal/intel-modal.component';
import { OpModalComponent } from '../../modals/op-modal/op-modal.component';

@Component({
    selector: 'app-operations-op-detail',
    templateUrl: './operations-op-detail.component.html',
    styleUrls: ['./operations-op-detail.component.scss'],
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
export class OperationsOpDetailComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private campaignsService = inject(CampaignsService);
    private gameServersService = inject(GameServersService);
    private dialog = inject(MatDialog);

    readonly OpStatus = OpStatus;
    readonly MissionFileState = MissionFileState;
    readonly CampaignStatus = CampaignStatus;

    campaignId = '';
    opId = '';
    campaign?: Campaign;
    dto?: OpDto;
    intel: IntelPage[] = [];
    private serverNames: Record<string, string> = {};

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('id') ?? '';
        this.opId = this.route.snapshot.paramMap.get('opId') ?? '';
        this.gameServersService
            .getServers()
            .pipe(first())
            .subscribe({ next: (update) => update.servers.forEach((s) => (this.serverNames[s.id] = s.name)) });
        this.load();
    }

    load() {
        this.campaignsService.getOp(this.opId).pipe(first()).subscribe({ next: (dto) => (this.dto = dto) });
        this.campaignsService.getCampaign(this.campaignId).pipe(first()).subscribe({ next: (c) => (this.campaign = c) });
        this.campaignsService.getIntel(IntelScope.Op, this.opId).pipe(first()).subscribe({ next: (intel) => (this.intel = intel) });
    }

    get serverName(): string {
        const id = this.dto?.op.serverId;
        return id ? (this.serverNames[id] ?? id) : '';
    }

    get stripe(): string {
        return this.dto ? mapBorderColour(mapTokenFromMission(this.dto.op.missionName)) : '';
    }

    get mapName(): string {
        return capitaliseMapName(mapTokenFromMission(this.dto?.op.missionName));
    }

    launch() {
        if (!this.dto) {
            return;
        }
        this.campaignsService
            .launchOp(this.dto.op.id)
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
            .open(IntelModalComponent, { data: { scope: IntelScope.Op, ownerId: this.opId } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (saved) => saved && this.load() });
    }

    editOp() {
        if (!this.dto) { return; }
        this.dialog
            .open(OpModalComponent, { data: { campaignId: this.campaignId, op: this.dto.op } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (saved) => saved && this.load() });
    }

    deleteOp() {
        if (!this.dto) { return; }
        this.dialog
            .open(ConfirmationModalComponent, { data: { title: 'Delete op', message: `Delete "${this.dto.op.title}"? This cannot be undone.`, button: 'Delete' } })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (confirmed) => {
                    if (confirmed) {
                        this.campaignsService.deleteOp(this.opId).pipe(first()).subscribe({ next: () => this.router.navigate(['/operations/campaigns', this.campaignId]) });
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
