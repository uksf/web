import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { QuillEditorComponent } from 'ngx-quill';
import { Observable, of } from 'rxjs';
import { first } from 'rxjs/operators';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { DropdownComponent } from '@app/shared/components/elements/dropdown/dropdown.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { Campaign, CampaignStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';

interface CampaignModalData {
    campaign?: Campaign;
}

@Component({
    selector: 'app-campaign-modal',
    templateUrl: './campaign-modal.component.html',
    styleUrls: ['./campaign-modal.component.scss'],
    imports: [FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, TextInputComponent, DropdownComponent, QuillEditorComponent, ButtonComponent]
})
export class CampaignModalComponent {
    private dialogRef = inject<MatDialogRef<CampaignModalComponent>>(MatDialogRef);
    private dialog = inject(MatDialog);
    private campaignsService = inject(CampaignsService);
    private data = inject<CampaignModalData>(MAT_DIALOG_DATA, { optional: true });

    isEdit = false;
    pending = false;
    model: Campaign = { id: '', name: '', brief: '', status: CampaignStatus.Active, theatre: '' };

    statusElements: Observable<IDropdownElement[]> = of([
        { value: String(CampaignStatus.Active), displayValue: 'Active' },
        { value: String(CampaignStatus.Archived), displayValue: 'Archived' }
    ]);
    statusValue = String(CampaignStatus.Active);

    constructor() {
        if (this.data?.campaign) {
            this.isEdit = true;
            this.model = { ...this.data.campaign };
            this.statusValue = String(this.model.status);
        }
    }

    submit() {
        if (!this.model.name || this.pending) {
            return;
        }
        this.pending = true;
        this.model.status = Number(this.statusValue);
        const request = this.isEdit ? this.campaignsService.updateCampaign(this.model) : this.campaignsService.addCampaign(this.model);
        request.pipe(first()).subscribe({
            next: () => this.dialogRef.close(true),
            error: (error) => {
                this.pending = false;
                this.dialog.open(MessageModalComponent, { data: { message: error?.error ?? 'Save failed' } });
            }
        });
    }

    cancel() {
        this.dialogRef.close();
    }
}
