import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxPermissionsModule } from 'ngx-permissions';
import { QuillEditorComponent, QuillViewComponent } from 'ngx-quill';
import { first } from 'rxjs/operators';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '@app/shared/components/content-areas/full-content-area/full-content-area.component';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { OpDto } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';

@Component({
    selector: 'app-operations-warno-detail',
    templateUrl: './operations-warno-detail.component.html',
    styleUrls: ['../../modals/_quill-modal-editor.scss', './operations-warno-detail.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        FullContentAreaComponent,
        RouterLink,
        FormsModule,
        MatIcon,
        MatIconButton,
        MatButton,
        MatTooltip,
        NgxPermissionsModule,
        QuillEditorComponent,
        QuillViewComponent,
        ButtonComponent
    ]
})
export class OperationsWarnoDetailComponent {
    private route = inject(ActivatedRoute);
    private campaignsService = inject(CampaignsService);
    private dialog = inject(MatDialog);

    campaignId = '';
    opId = '';
    dto?: OpDto;
    editing = false;
    pending = false;
    draft = '';
    quillModules = {
        toolbar: [['bold', 'italic', 'underline', 'strike'], ['blockquote'], [{ header: 1 }, { header: 2 }], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']]
    };

    get backLink(): string[] {
        return ['/operations/campaigns', this.campaignId, 'ops', this.opId];
    }

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('id') ?? '';
        this.opId = this.route.snapshot.paramMap.get('opId') ?? '';
        this.load();
    }

    load() {
        this.campaignsService.getOp(this.opId).pipe(first()).subscribe({ next: (dto) => (this.dto = dto) });
    }

    edit() {
        if (!this.dto) {
            return;
        }
        this.draft = this.dto.op.warno;
        this.editing = true;
    }

    save() {
        if (!this.dto || this.pending) {
            return;
        }
        this.pending = true;
        this.campaignsService
            .updateOp({ ...this.dto.op, warno: this.draft })
            .pipe(first())
            .subscribe({
                next: () => {
                    this.pending = false;
                    this.editing = false;
                    this.load();
                },
                error: (error) => {
                    this.pending = false;
                    this.dialog.open(MessageModalComponent, { data: { message: error?.error ?? 'Save failed' } });
                }
            });
    }

    cancelEdit() {
        this.editing = false;
    }
}
