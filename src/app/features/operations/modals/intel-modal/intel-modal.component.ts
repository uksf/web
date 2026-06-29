import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { QuillEditorComponent } from 'ngx-quill';
import { first } from 'rxjs/operators';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { IntelPage, IntelScope } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';

interface IntelModalData {
    scope: IntelScope;
    ownerId: string;
    page?: IntelPage;
}

@Component({
    selector: 'app-intel-modal',
    templateUrl: './intel-modal.component.html',
    styleUrls: ['./intel-modal.component.scss', '../_quill-modal-editor.scss'],
    imports: [FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, TextInputComponent, QuillEditorComponent, ButtonComponent]
})
export class IntelModalComponent {
    private dialogRef = inject<MatDialogRef<IntelModalComponent>>(MatDialogRef);
    private dialog = inject(MatDialog);
    private campaignsService = inject(CampaignsService);
    private data = inject<IntelModalData>(MAT_DIALOG_DATA);

    isEdit = false;
    pending = false;
    quillModules = {
        toolbar: [['bold', 'italic', 'underline', 'strike'], ['blockquote'], [{ header: 1 }, { header: 2 }], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']]
    };
    model: IntelPage = { id: '', scope: IntelScope.Campaign, ownerId: '', title: '', body: '' };

    constructor() {
        if (this.data.page) {
            this.isEdit = true;
            this.model = { ...this.data.page };
        } else {
            this.model.scope = this.data.scope;
            this.model.ownerId = this.data.ownerId;
        }
    }

    submit() {
        if (!this.model.title || this.pending) {
            return;
        }
        this.pending = true;
        const request = this.isEdit ? this.campaignsService.updateIntel(this.model) : this.campaignsService.addIntel(this.model);
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
