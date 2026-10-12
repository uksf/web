import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { first } from 'rxjs/operators';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { DropdownComponent } from '@app/shared/components/elements/dropdown/dropdown.component';
import { DateInputComponent } from '@app/shared/components/elements/date-input/date-input.component';
import { TemplateFormValueDebugComponent } from '@app/shared/components/elements/form-value-debug/form-value-debug.component';
import { DocsEditorComponent } from '@app/shared/components/docs-editor/docs-editor.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { Campaign, CampaignStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';

@Component({
    selector: 'app-operations-campaign-editor',
    templateUrl: './operations-campaign-editor.component.html',
    styleUrls: ['../_docs-editor-page.scss'],
    imports: [FormsModule, TextInputComponent, DropdownComponent, DateInputComponent, ButtonComponent, DocsEditorComponent, TemplateFormValueDebugComponent]
})
export class OperationsCampaignEditorComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private dialog = inject(MatDialog);
    private campaignsService = inject(CampaignsService);

    isEdit = false;
    pending = false;
    missing = false;
    ready = false;
    model: Campaign = { id: '', name: '', summary: '', status: CampaignStatus.Upcoming };

    statusOptions: IDropdownElement[] = [
        { value: String(CampaignStatus.Upcoming), displayValue: 'Upcoming' },
        { value: String(CampaignStatus.Current), displayValue: 'Current' },
        { value: String(CampaignStatus.Past), displayValue: 'Past' }
    ];
    statusElements: Observable<IDropdownElement[]> = of(this.statusOptions);
    statusValue: IDropdownElement | null = this.statusOptions[0];
    startDate: Date | null = null;

    constructor() {
        const campaignId = this.route.snapshot.paramMap.get('campaignId');
        if (!campaignId) {
            this.ready = true;
            return;
        }
        this.isEdit = true;
        this.campaignsService.getCampaign(campaignId).pipe(first()).subscribe({
            next: (campaign) => {
                this.model = { ...campaign };
                this.statusValue = this.statusOptions.find((o) => o.value === String(this.model.status)) ?? this.statusOptions[0];
                this.startDate = campaign.start ? new Date(campaign.start) : null;
                this.ready = true;
            },
            error: () => (this.missing = true)
        });
    }

    cancel() {
        this.router.navigate(this.isEdit && this.model.id ? ['/operations/campaigns', this.model.id] : ['/operations/campaigns']);
    }

    submit() {
        if (!this.model.name || this.pending || this.missing || !this.ready) {
            return;
        }
        this.pending = true;
        this.model.status = Number(this.statusValue?.value ?? CampaignStatus.Upcoming);
        this.model.start = this.startDate?.toISOString();
        const request = this.isEdit ? this.campaignsService.updateCampaign(this.model) : this.campaignsService.addCampaign(this.model);
        request.pipe(first()).subscribe({
            next: () => this.cancel(),
            error: (error) => {
                this.pending = false;
                this.dialog.open(MessageModalComponent, { data: { message: error?.error ?? 'Save failed' } });
            }
        });
    }
}
