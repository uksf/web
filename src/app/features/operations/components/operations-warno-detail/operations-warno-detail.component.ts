import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxPermissionsModule } from 'ngx-permissions';
import { first } from 'rxjs/operators';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { DocsEditorComponent } from '@app/shared/components/docs-editor/docs-editor.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { CampaignMissionDto } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';

@Component({
    selector: 'app-operations-warno-detail',
    templateUrl: './operations-warno-detail.component.html',
    styleUrls: ['../_docs-editor-page.scss', './operations-warno-detail.component.scss'],
    imports: [RouterLink, MatIcon, MatIconButton, MatTooltip, NgxPermissionsModule, ButtonComponent, DocsEditorComponent]
})
export class OperationsWarnoDetailComponent {
    private route = inject(ActivatedRoute);
    private campaignsService = inject(CampaignsService);
    private dialog = inject(MatDialog);

    campaignId = '';
    operationId = '';
    missionId = '';
    dto?: CampaignMissionDto;
    missing = false;
    editing = false;
    pending = false;
    draft = '';

    get backLink(): string[] {
        return ['/operations/campaigns', this.campaignId, 'operations', this.operationId, 'missions', this.missionId];
    }

    constructor() {
        this.campaignId = this.route.snapshot.paramMap.get('campaignId') ?? '';
        this.operationId = this.route.snapshot.paramMap.get('operationId') ?? '';
        this.missionId = this.route.snapshot.paramMap.get('missionId') ?? '';
        this.load();
    }

    load() {
        this.campaignsService.getMission(this.campaignId, this.operationId, this.missionId).pipe(first()).subscribe({
            next: (dto) => (this.dto = dto),
            error: () => (this.missing = true)
        });
    }

    edit() {
        if (!this.dto) {
            return;
        }
        this.draft = this.dto.mission.warno;
        this.editing = true;
    }

    save() {
        if (!this.dto || this.pending) {
            return;
        }
        this.pending = true;
        this.campaignsService
            .updateMission(this.campaignId, this.operationId, { ...this.dto.mission, warno: this.draft })
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
