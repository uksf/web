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
import { Operation, OperationStatus } from '../../models/campaign';
import { TemplateFormValueDebugComponent } from '@app/shared/components/elements/form-value-debug/form-value-debug.component';
import { CampaignsService } from '../../services/campaigns.service';

interface OperationModalData {
    campaignId: string;
    operation?: Operation;
}

@Component({
    selector: 'app-operation-modal',
    templateUrl: './operation-modal.component.html',
    styleUrls: ['./operation-modal.component.scss', '../_quill-modal-editor.scss'],
    imports: [FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, TextInputComponent, DropdownComponent, QuillEditorComponent, ButtonComponent, TemplateFormValueDebugComponent]
})
export class OperationModalComponent {
    private dialogRef = inject<MatDialogRef<OperationModalComponent>>(MatDialogRef);
    private dialog = inject(MatDialog);
    private campaignsService = inject(CampaignsService);
    private data = inject<OperationModalData>(MAT_DIALOG_DATA);

    isEdit = false;
    pending = false;
    quillModules = {
        toolbar: [['bold', 'italic', 'underline', 'strike'], ['blockquote'], [{ header: 1 }, { header: 2 }], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']]
    };
    model: Operation = { id: '', campaignId: '', title: '', brief: '', status: OperationStatus.Upcoming };

    statusOptions: IDropdownElement[] = [
        { value: String(OperationStatus.Upcoming), displayValue: 'Upcoming' },
        { value: String(OperationStatus.Current), displayValue: 'Current' },
        { value: String(OperationStatus.Past), displayValue: 'Past' }
    ];
    statusElements: Observable<IDropdownElement[]> = of(this.statusOptions);
    statusValue: IDropdownElement | null = this.statusOptions[0];

    constructor() {
        this.model.campaignId = this.data.campaignId;
        if (this.data.operation) {
            this.isEdit = true;
            this.model = { ...this.data.operation };
            this.statusValue = this.statusOptions.find((o) => o.value === String(this.model.status)) ?? this.statusOptions[0];
        }
    }

    submit() {
        if (!this.model.title || this.pending) {
            return;
        }
        this.pending = true;
        this.model.status = Number(this.statusValue?.value ?? OperationStatus.Upcoming);
        const request = this.isEdit
            ? this.campaignsService.updateOperation(this.data.campaignId, this.model.id, this.model)
            : this.campaignsService.addOperation(this.data.campaignId, this.model);
        request.pipe(first()).subscribe({
            next: () => this.dialogRef.close(true),
            error: (error) => {
                this.pending = false;
                this.dialog.open(MessageModalComponent, { data: { message: error?.error ?? 'Save failed' } });
            }
        });
    }
}
