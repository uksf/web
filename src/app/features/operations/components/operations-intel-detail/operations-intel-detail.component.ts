import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxPermissionsModule } from 'ngx-permissions';
import { QuillViewComponent } from 'ngx-quill';
import { first } from 'rxjs/operators';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { Campaign, IntelPage, IntelScope, OpDto } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';
import { IntelModalComponent } from '../../modals/intel-modal/intel-modal.component';

@Component({
    selector: 'app-operations-intel-detail',
    templateUrl: './operations-intel-detail.component.html',
    styleUrls: ['./operations-intel-detail.component.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, RouterLink, MatIcon, MatButton, MatIconButton, MatTooltip, QuillViewComponent, NgxPermissionsModule]
})
export class OperationsIntelDetailComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private campaignsService = inject(CampaignsService);
    private dialog = inject(MatDialog);

    campaignId = '';
    opId: string | null = null;
    intelId = '';
    campaign?: Campaign;
    op?: OpDto;
    page?: IntelPage;

    get backLink(): string[] {
        return this.opId ? ['/operations/campaigns', this.campaignId, 'ops', this.opId] : ['/operations/campaigns', this.campaignId];
    }

    get backLabel(): string {
        return this.opId ? (this.op?.op.title ?? '') : (this.campaign?.name ?? '');
    }

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('id') ?? '';
        this.opId = this.route.snapshot.paramMap.get('opId');
        this.intelId = this.route.snapshot.paramMap.get('intelId') ?? '';
        this.load();
    }

    load() {
        this.campaignsService.getCampaign(this.campaignId).pipe(first()).subscribe({ next: (c) => (this.campaign = c) });
        if (this.opId) {
            this.campaignsService.getOp(this.opId).pipe(first()).subscribe({ next: (dto) => (this.op = dto) });
        }
        const scope = this.opId ? IntelScope.Op : IntelScope.Campaign;
        const ownerId = this.opId ?? this.campaignId;
        this.campaignsService
            .getIntel(scope, ownerId)
            .pipe(first())
            .subscribe({ next: (pages) => (this.page = pages.find((p) => p.id === this.intelId)) });
    }

    edit() {
        if (!this.page) {
            return;
        }
        this.dialog
            .open(IntelModalComponent, { data: { scope: this.page.scope, ownerId: this.page.ownerId, page: this.page } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (saved) => saved && this.load() });
    }

    delete() {
        if (!this.page) {
            return;
        }
        this.dialog
            .open(ConfirmationModalComponent, { data: { title: 'Delete intel page', message: `Delete "${this.page.title}"?`, button: 'Delete' } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (confirmed) => confirmed && this.campaignsService.deleteIntel(this.page!.id).pipe(first()).subscribe({ next: () => this.router.navigate(this.backLink) }) });
    }
}
