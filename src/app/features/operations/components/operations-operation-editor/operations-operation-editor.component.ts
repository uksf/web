import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { DropdownComponent } from '@app/shared/components/elements/dropdown/dropdown.component';
import { TemplateFormValueDebugComponent } from '@app/shared/components/elements/form-value-debug/form-value-debug.component';
import { DocsEditorComponent } from '@app/shared/components/docs-editor/docs-editor.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { CampaignStatus, Operation, OperationStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';

@Component({
    selector: 'app-operations-operation-editor',
    templateUrl: './operations-operation-editor.component.html',
    styleUrls: ['../_docs-editor-page.scss'],
    imports: [FormsModule, TextInputComponent, DropdownComponent, ButtonComponent, DocsEditorComponent, TemplateFormValueDebugComponent]
})
export class OperationsOperationEditorComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private dialog = inject(MatDialog);
    private campaignsService = inject(CampaignsService);

    campaignId = '';
    isEdit = false;
    pending = false;
    missing = false;
    creationBlocked = false;
    ready = false;
    model: Operation = { id: '', campaignId: '', title: '', brief: '', status: OperationStatus.Upcoming };

    statusOptions: IDropdownElement[] = [
        { value: String(OperationStatus.Upcoming), displayValue: 'Upcoming' },
        { value: String(OperationStatus.Current), displayValue: 'Current' },
        { value: String(OperationStatus.Past), displayValue: 'Past' }
    ];
    statusElements: Observable<IDropdownElement[]> = of(this.statusOptions);
    statusValue: IDropdownElement | null = this.statusOptions[0];

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('campaignId') ?? '';
        this.model.campaignId = this.campaignId;
        const operationId = this.route.snapshot.paramMap.get('operationId');
        this.isEdit = !!operationId;
        this.campaignsService
            .getCampaign(this.campaignId)
            .pipe(
                switchMap((campaign) => {
                    if (!this.isEdit && campaign.status === CampaignStatus.Past) {
                        this.creationBlocked = true;
                        this.router.navigate(['/operations/campaigns', this.campaignId]);
                        return of(null);
                    }
                    return operationId ? this.campaignsService.getOperation(this.campaignId, operationId) : of(null);
                }),
                first()
            )
            .subscribe({
                next: (operation) => {
                    if (this.creationBlocked) {
                        return;
                    }
                    if (this.isEdit) {
                        if (!operation) {
                            this.missing = true;
                            return;
                        }
                        this.model = { ...operation };
                        this.statusValue = this.statusOptions.find((o) => o.value === String(this.model.status)) ?? this.statusOptions[0];
                    }
                    this.ready = true;
                },
                error: () => (this.missing = true)
            });
    }

    cancel() {
        this.router.navigate(
            this.isEdit && this.model.id
                ? ['/operations/campaigns', this.campaignId, 'operations', this.model.id]
                : ['/operations/campaigns', this.campaignId]
        );
    }

    submit() {
        if (!this.model.title || this.pending || this.missing || this.creationBlocked || !this.ready) {
            return;
        }
        this.pending = true;
        this.model.status = Number(this.statusValue?.value ?? OperationStatus.Upcoming);
        const request = this.isEdit
            ? this.campaignsService.updateOperation(this.campaignId, this.model.id, this.model)
            : this.campaignsService.addOperation(this.campaignId, this.model);
        request.pipe(first()).subscribe({
            next: () => this.cancel(),
            error: (error) => {
                this.pending = false;
                this.dialog.open(MessageModalComponent, { data: { message: error?.error ?? 'Save failed' } });
            }
        });
    }
}
