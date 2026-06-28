import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton } from '@angular/material/button';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { mapBorderColour, capitaliseMapName } from '../../utils/map-colour';
import { findCampaign, StubCampaign, StubOp } from '../operations-campaigns/campaign-stub-data';

@Component({
    selector: 'app-operations-campaign-detail',
    templateUrl: './operations-campaign-detail.component.html',
    styleUrls: ['./operations-campaign-detail.component.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, RouterLink, MatIcon, MatButton, MatAnchor]
})
export class OperationsCampaignDetailComponent {
    private route = inject(ActivatedRoute);
    campaign?: StubCampaign;

    constructor() {
        this.campaign = findCampaign(this.route.snapshot.paramMap.get('id') ?? '');
    }

    stripe(op: StubOp): string {
        return mapBorderColour(op.map);
    }

    map(op: StubOp): string {
        return capitaliseMapName(op.map);
    }
}
