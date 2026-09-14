import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { TemplateFormValueDebugComponent } from '@app/shared/components/elements/form-value-debug/form-value-debug.component';
import { DocsEditorComponent } from '@app/shared/components/docs-editor/docs-editor.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { CampaignStatus, IntelPage, IntelScope } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';

@Component({
    selector: 'app-operations-intel-editor',
    templateUrl: './operations-intel-editor.component.html',
    styleUrls: ['../_docs-editor-page.scss'],
    imports: [FormsModule, TextInputComponent, ButtonComponent, DocsEditorComponent, TemplateFormValueDebugComponent]
})
export class OperationsIntelEditorComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private dialog = inject(MatDialog);
    private campaignsService = inject(CampaignsService);

    campaignId = '';
    operationId: string | null = null;
    missionId: string | null = null;
    isEdit = false;
    pending = false;
    missing = false;
    creationBlocked = false;
    ready = false;
    model: IntelPage = { id: '', scope: IntelScope.Campaign, ownerId: '', title: '', body: '' };

    get backLink(): string[] {
        if (this.isEdit && this.model.id) {
            if (this.missionId && this.operationId) {
                return ['/operations/campaigns', this.campaignId, 'operations', this.operationId, 'missions', this.missionId, 'intel', this.model.id];
            }
            if (this.operationId) {
                return ['/operations/campaigns', this.campaignId, 'operations', this.operationId, 'intel', this.model.id];
            }
            return ['/operations/campaigns', this.campaignId, 'intel', this.model.id];
        }
        if (this.missionId && this.operationId) {
            return ['/operations/campaigns', this.campaignId, 'operations', this.operationId, 'missions', this.missionId];
        }
        if (this.operationId) {
            return ['/operations/campaigns', this.campaignId, 'operations', this.operationId];
        }
        return ['/operations/campaigns', this.campaignId];
    }

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('campaignId') ?? '';
        this.operationId = this.route.snapshot.paramMap.get('operationId');
        this.missionId = this.route.snapshot.paramMap.get('missionId');
        const intelId = this.route.snapshot.paramMap.get('intelId');
        this.isEdit = !!intelId;
        this.model.scope = this.missionId ? IntelScope.Mission : this.operationId ? IntelScope.Operation : IntelScope.Campaign;
        this.model.ownerId = this.missionId ?? this.operationId ?? this.campaignId;

        forkJoin({
            campaign: this.campaignsService.getCampaign(this.campaignId),
            operation: this.operationId ? this.campaignsService.getOperation(this.campaignId, this.operationId) : of(null),
            mission: this.missionId && this.operationId ? this.campaignsService.getMission(this.campaignId, this.operationId, this.missionId) : of(null)
        })
            .pipe(
                switchMap(({ campaign, operation, mission }) => {
                    if ((this.operationId && !operation) || (this.missionId && !mission)) {
                        this.missing = true;
                        return of(null);
                    }
                    if (!this.isEdit && campaign.status === CampaignStatus.Past) {
                        this.creationBlocked = true;
                        this.router.navigate(this.backLink);
                        return of(null);
                    }
                    return this.isEdit ? this.campaignsService.getIntel(this.model.scope, this.model.ownerId) : of([]);
                }),
                first()
            )
            .subscribe({
                next: (pages) => {
                    if (this.creationBlocked || this.missing) {
                        return;
                    }
                    if (this.isEdit) {
                        if (!pages) {
                            this.missing = true;
                            return;
                        }
                        const page = pages.find((p) => p.id === intelId);
                        if (!page) {
                            this.missing = true;
                            return;
                        }
                        this.model = { ...page };
                    }
                    this.ready = true;
                },
                error: () => (this.missing = true)
            });
    }

    cancel() {
        this.router.navigate(this.backLink);
    }

    submit() {
        if (!this.model.title || this.pending || this.missing || this.creationBlocked || !this.ready) {
            return;
        }
        this.pending = true;
        const request = this.isEdit ? this.campaignsService.updateIntel(this.model) : this.campaignsService.addIntel(this.model);
        request.pipe(first()).subscribe({
            next: () => this.cancel(),
            error: (error) => {
                this.pending = false;
                this.dialog.open(MessageModalComponent, { data: { message: error?.error ?? 'Save failed' } });
            }
        });
    }
}
