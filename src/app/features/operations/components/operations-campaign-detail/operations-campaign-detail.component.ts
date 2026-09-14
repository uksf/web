import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxPermissionsModule } from 'ngx-permissions';
import { QuillViewComponent } from 'ngx-quill';
import { first } from 'rxjs/operators';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { Campaign, CampaignStatus, IntelPage, IntelScope, Operation, OperationStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';


@Component({
    selector: 'app-operations-campaign-detail',
    templateUrl: './operations-campaign-detail.component.html',
    styleUrls: ['../operations-detail-chrome.scss', '../operations-detail-cards.scss', './operations-campaign-detail.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        FullContentAreaComponent,
        RouterLink,
        MatIcon,
        MatButton,
        MatAnchor,
        MatIconButton,
        MatTooltip,
        QuillViewComponent,
        NgxPermissionsModule
    ]
})
export class OperationsCampaignDetailComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private campaignsService = inject(CampaignsService);
    private dialog = inject(MatDialog);

    readonly CampaignStatus = CampaignStatus;
    readonly OperationStatus = OperationStatus;

    campaignId = '';
    campaign?: Campaign;
    operations: Operation[] = [];
    intel: IntelPage[] = [];
    missing = false;

    get isPastCampaign(): boolean {
        return this.campaign?.status === CampaignStatus.Past;
    }

    get statusLabel(): string {
        switch (this.campaign?.status) {
            case CampaignStatus.Current:
                return 'Current';
            case CampaignStatus.Upcoming:
                return 'Upcoming';
            default:
                return 'Past';
        }
    }

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('campaignId') ?? '';
        this.load();
    }

    load() {
        this.campaignsService.getCampaign(this.campaignId).pipe(first()).subscribe({
            next: (c) => (this.campaign = c),
            error: () => (this.missing = true)
        });
        this.campaignsService.getOperations(this.campaignId).pipe(first()).subscribe({ next: (operations) => (this.operations = operations) });
        this.campaignsService.getIntel(IntelScope.Campaign, this.campaignId).pipe(first()).subscribe({ next: (intel) => (this.intel = intel) });
    }

    operationStatusLabel(operation: Operation): string {
        switch (operation.status) {
            case OperationStatus.Current:
                return 'Current';
            case OperationStatus.Upcoming:
                return 'Upcoming';
            default:
                return 'Past';
        }
    }

    createIntel() {
        this.router.navigate(['/operations/campaigns', this.campaignId, 'intel', 'new']);
    }

    createOperation() {
        this.router.navigate(['/operations/campaigns', this.campaignId, 'operations', 'new']);
    }

    editCampaign() {
        if (!this.campaign) { return; }
        this.router.navigate(['/operations/campaigns', this.campaignId, 'edit']);
    }

    deleteCampaign() {
        if (!this.campaign) { return; }
        this.dialog
            .open(ConfirmationModalComponent, { data: { title: 'Delete campaign', message: `Delete "${this.campaign.name}" and all its operations? This cannot be undone.`, button: 'Delete' } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (confirmed) => confirmed && this.campaignsService.deleteCampaign(this.campaignId).pipe(first()).subscribe({ next: () => this.router.navigate(['/operations/campaigns']) }) });
    }

    openOperation(operation: Operation) {
        this.router.navigate(['operations', operation.id], { relativeTo: this.route });
    }

    editOperation(operation: Operation) {
        this.router.navigate(['/operations/campaigns', this.campaignId, 'operations', operation.id, 'edit']);
    }

    deleteOperation(operation: Operation) {
        this.dialog
            .open(ConfirmationModalComponent, { data: { title: 'Delete operation', message: `Delete "${operation.title}" and all its missions?`, button: 'Delete' } })
            .afterClosed()
            .pipe(first())
            .subscribe({ next: (confirmed) => confirmed && this.campaignsService.deleteOperation(this.campaignId, operation.id).pipe(first()).subscribe({ next: () => this.load() }) });
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
