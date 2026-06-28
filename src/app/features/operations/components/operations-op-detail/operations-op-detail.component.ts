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
import { capitaliseMapName, mapBorderColour, mapTokenFromMission } from '../../utils/map-colour';
import { Campaign, IntelPage, IntelScope, MissionFileState, OpDto, OpStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';
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
        DatePipe,
        QuillViewComponent,
        NgxPermissionsModule
    ]
})
export class OperationsOpDetailComponent {
    private route = inject(ActivatedRoute);
    private campaignsService = inject(CampaignsService);
    private dialog = inject(MatDialog);

    readonly OpStatus = OpStatus;
    readonly MissionFileState = MissionFileState;

    campaignId = '';
    opId = '';
    campaign?: Campaign;
    dto?: OpDto;
    intel: IntelPage[] = [];

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('id') ?? '';
        this.opId = this.route.snapshot.paramMap.get('opId') ?? '';
        this.load();
    }

    load() {
        this.campaignsService.getOp(this.opId).pipe(first()).subscribe({ next: (dto) => (this.dto = dto) });
        this.campaignsService.getCampaign(this.campaignId).pipe(first()).subscribe({ next: (c) => (this.campaign = c) });
        this.campaignsService.getIntel(IntelScope.Op, this.opId).pipe(first()).subscribe({ next: (intel) => (this.intel = intel) });
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

    editOp() {
        if (!this.dto) { return; }
        this.dialog
            .open(OpModalComponent, { data: { campaignId: this.campaignId, op: this.dto.op } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (saved) => saved && this.load() });
    }
}
