import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton } from '@angular/material/button';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { mapBorderColour, capitaliseMapName } from '../../utils/map-colour';
import { STUB_CAMPAIGNS, StubCampaign } from './campaign-stub-data';

@Component({
    selector: 'app-operations-campaigns',
    templateUrl: './operations-campaigns.component.html',
    styleUrls: ['./operations-campaigns.component.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, RouterLink, MatIcon, MatButton, MatAnchor]
})
export class OperationsCampaignsComponent {
    campaigns = STUB_CAMPAIGNS;

    stripe(campaign: StubCampaign): string {
        return mapBorderColour(campaign.theatre);
    }

    theatre(campaign: StubCampaign): string {
        return capitaliseMapName(campaign.theatre);
    }

    summary(campaign: StubCampaign): string {
        const complete = campaign.ops.filter((o) => o.status === 'Complete').length;
        return `${campaign.status} · ${campaign.ops.length} ops · ${complete} complete`;
    }
}
