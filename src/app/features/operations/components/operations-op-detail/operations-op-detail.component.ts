import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton } from '@angular/material/button';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { capitaliseMapName, mapBorderColour } from '../../utils/map-colour';
import { findOp, StubCampaign, StubOp } from '../operations-campaigns/campaign-stub-data';

@Component({
    selector: 'app-operations-op-detail',
    templateUrl: './operations-op-detail.component.html',
    styleUrls: ['./operations-op-detail.component.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, RouterLink, MatIcon, MatButton, MatAnchor]
})
export class OperationsOpDetailComponent {
    private route = inject(ActivatedRoute);
    campaign?: StubCampaign;
    op?: StubOp;

    constructor() {
        const params = this.route.snapshot.paramMap;
        const found = findOp(params.get('id') ?? '', params.get('opId') ?? '');
        this.campaign = found?.campaign;
        this.op = found?.op;
    }

    get stripe(): string {
        return this.op ? mapBorderColour(this.op.map) : '';
    }

    get mapName(): string {
        return this.op ? capitaliseMapName(this.op.map) : '';
    }
}
