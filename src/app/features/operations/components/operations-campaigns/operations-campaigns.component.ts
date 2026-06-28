import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton } from '@angular/material/button';
import { NgxPermissionsModule } from 'ngx-permissions';
import { first } from 'rxjs/operators';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { mapBorderColour, capitaliseMapName } from '../../utils/map-colour';
import { Campaign, CampaignStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';

@Component({
    selector: 'app-operations-campaigns',
    templateUrl: './operations-campaigns.component.html',
    styleUrls: ['./operations-campaigns.component.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, RouterLink, MatIcon, MatButton, MatAnchor, NgxPermissionsModule]
})
export class OperationsCampaignsComponent {
    private campaignsService = inject(CampaignsService);
    private dialog = inject(MatDialog);

    campaigns: Campaign[] = [];

    constructor() {
        this.load();
    }

    load() {
        this.campaignsService
            .getCampaigns()
            .pipe(first())
            .subscribe({ next: (campaigns) => (this.campaigns = campaigns) });
    }

    stripe(campaign: Campaign): string {
        return mapBorderColour(campaign.theatre ?? '');
    }

    theatre(campaign: Campaign): string {
        return campaign.theatre ? capitaliseMapName(campaign.theatre) : '';
    }

    summary(campaign: Campaign): string {
        return campaign.status === CampaignStatus.Archived ? 'Archived' : 'Active';
    }

    createCampaign() {
        // Filled in Task 6 (campaign modal). Left as a method so the template binds now.
    }
}
