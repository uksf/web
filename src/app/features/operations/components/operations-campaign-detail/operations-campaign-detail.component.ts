import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton } from '@angular/material/button';
import { NgxPermissionsModule } from 'ngx-permissions';
import { QuillViewComponent } from 'ngx-quill';
import { first } from 'rxjs/operators';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { mapBorderColour, capitaliseMapName, mapTokenFromMission } from '../../utils/map-colour';
import { Campaign, IntelPage, IntelScope, MissionFileState, Op, OpDto, OpStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';

@Component({
    selector: 'app-operations-campaign-detail',
    templateUrl: './operations-campaign-detail.component.html',
    styleUrls: ['./operations-campaign-detail.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        FullContentAreaComponent,
        RouterLink,
        MatIcon,
        MatButton,
        MatAnchor,
        DatePipe,
        QuillViewComponent,
        NgxPermissionsModule
    ]
})
export class OperationsCampaignDetailComponent {
    private route = inject(ActivatedRoute);
    private campaignsService = inject(CampaignsService);
    private dialog = inject(MatDialog);

    readonly OpStatus = OpStatus;
    readonly MissionFileState = MissionFileState;

    campaignId = '';
    campaign?: Campaign;
    ops: OpDto[] = [];
    intel: IntelPage[] = [];

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('id') ?? '';
        this.load();
    }

    load() {
        this.campaignsService.getCampaign(this.campaignId).pipe(first()).subscribe({ next: (c) => (this.campaign = c) });
        this.campaignsService.getOps(this.campaignId).pipe(first()).subscribe({ next: (ops) => (this.ops = ops) });
        this.campaignsService.getIntel(IntelScope.Campaign, this.campaignId).pipe(first()).subscribe({ next: (intel) => (this.intel = intel) });
    }

    stripe(op: Op): string {
        return mapBorderColour(mapTokenFromMission(op.missionName));
    }

    mapName(op: Op): string {
        return capitaliseMapName(mapTokenFromMission(op.missionName));
    }

    launch(dto: OpDto) {
        this.campaignsService
            .launchOp(dto.op.id)
            .pipe(first())
            .subscribe({
                next: (reports) => {
                    if (reports && reports.length > 0) {
                        this.dialog.open(MessageModalComponent, {
                            // ValidationReport fields: detail (string), title (string), error (boolean)
                            data: { title: 'Mission patched with warnings', message: reports.map((r) => r.detail ?? r.title ?? JSON.stringify(r)).join('\n') }
                        });
                    }
                    this.load();
                },
                error: (error) => this.dialog.open(MessageModalComponent, { data: { message: error?.error ?? 'Launch failed' } })
            });
    }

    createOp() {
        // Filled in Task 7 (op modal).
    }

    editCampaign() {
        // Filled in Task 6 (campaign modal).
    }
}
