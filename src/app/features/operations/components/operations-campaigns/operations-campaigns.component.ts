import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { NgxPermissionsModule } from 'ngx-permissions';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { capitaliseMapName, mapTokenFromMission } from '../../utils/map-colour';
import { Campaign, CampaignStatus, OpDto } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';
import { CampaignModalComponent } from '../../modals/campaign-modal/campaign-modal.component';

@Component({
    selector: 'app-operations-campaigns',
    templateUrl: './operations-campaigns.component.html',
    styleUrls: ['./operations-campaigns.component.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, RouterLink, MatIcon, MatButton, NgxPermissionsModule]
})
export class OperationsCampaignsComponent {
    private campaignsService = inject(CampaignsService);
    private dialog = inject(MatDialog);

    readonly CampaignStatus = CampaignStatus;

    campaigns: Campaign[] = [];
    sections: { title: string; items: Campaign[]; muted: boolean }[] = [];
    private theatreTokens = new Map<string, string[]>();

    constructor() {
        this.load();
    }

    load() {
        forkJoin({
            campaigns: this.campaignsService.getCampaigns().pipe(first()),
            ops: this.campaignsService.getAllOps().pipe(first())
        }).subscribe({
            next: ({ campaigns, ops }) => {
                this.buildTheatres(ops);
                this.campaigns = campaigns;
                this.sections = [
                    { title: 'Current', items: campaigns.filter((c) => c.status === CampaignStatus.Current), muted: false },
                    { title: 'Upcoming', items: campaigns.filter((c) => c.status === CampaignStatus.Upcoming), muted: false },
                    { title: 'Past', items: campaigns.filter((c) => c.status === CampaignStatus.Past), muted: true }
                ].filter((s) => s.items.length > 0);
            }
        });
    }

    private buildTheatres(ops: OpDto[]) {
        const tokens = new Map<string, string[]>();
        for (const dto of ops) {
            const token = mapTokenFromMission(dto.op.missionName);
            if (!token) {
                continue;
            }
            const list = tokens.get(dto.op.campaignId) ?? [];
            if (!list.includes(token)) {
                list.push(token);
            }
            tokens.set(dto.op.campaignId, list);
        }
        this.theatreTokens = tokens;
    }

    theatre(campaign: Campaign): string {
        return (this.theatreTokens.get(campaign.id) ?? []).map(capitaliseMapName).join(' · ');
    }

    createCampaign() {
        this.dialog
            .open(CampaignModalComponent)
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (saved) => saved && this.load() });
    }
}
