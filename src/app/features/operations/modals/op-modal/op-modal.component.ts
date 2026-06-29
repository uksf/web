import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { QuillEditorComponent } from 'ngx-quill';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { DropdownComponent } from '@app/shared/components/elements/dropdown/dropdown.component';
import { DateInputComponent } from '@app/shared/components/elements/date-input/date-input.component';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { Op, OpStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';
import { GameServersService } from '../../services/game-servers.service';
import { MissionsService } from '../../services/missions.service';

interface OpModalData {
    campaignId: string;
    op?: Op;
}

@Component({
    selector: 'app-op-modal',
    templateUrl: './op-modal.component.html',
    styleUrls: ['./op-modal.component.scss', '../_quill-modal-editor.scss'],
    imports: [FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, TextInputComponent, DropdownComponent, DateInputComponent, QuillEditorComponent, ButtonComponent]
})
export class OpModalComponent {
    private dialogRef = inject<MatDialogRef<OpModalComponent>>(MatDialogRef);
    private dialog = inject(MatDialog);
    private campaignsService = inject(CampaignsService);
    private gameServersService = inject(GameServersService);
    private missionsService = inject(MissionsService);
    private data = inject<OpModalData>(MAT_DIALOG_DATA);

    isEdit = false;
    pending = false;
    quillModules = {
        toolbar: [['bold', 'italic', 'underline', 'strike'], ['blockquote'], [{ header: 1 }, { header: 2 }], [{ list: 'ordered' }, { list: 'bullet' }], ['link'], ['clean']]
    };
    model: Op = { id: '', campaignId: '', title: '', scheduledTime: '', serverId: '', missionName: '', warno: '', status: OpStatus.Scheduled };

    scheduledDate: Date | null = null;
    scheduledTimeText = '19:00';

    servers$ = new BehaviorSubject<IDropdownElement[]>([]);
    missions$ = new BehaviorSubject<IDropdownElement[]>([]);
    serverValue: IDropdownElement | null = null;
    missionValue: IDropdownElement | null = null;

    constructor() {
        this.model.campaignId = this.data.campaignId;
        if (this.data.op) {
            this.isEdit = true;
            this.model = { ...this.data.op };
            this.scheduledDate = this.model.scheduledTime ? new Date(this.model.scheduledTime) : null;
            this.scheduledTimeText = this.scheduledDate ? this.formatTime(this.scheduledDate) : '19:00';
        } else {
            this.scheduledDate = this.nextStandardOpTime();
        }
        this.loadServers();
        this.loadMissions();
    }

    private loadServers() {
        this.gameServersService.getServers().pipe(first()).subscribe({
            next: (update) => {
                const serverElements = update.servers.map((s) => ({ value: s.id, displayValue: s.name }));
                this.servers$.next(serverElements);
                if (!this.isEdit) {
                    const main = update.servers.find((s) => s.name === 'Main Server') ?? update.servers[0];
                    if (main) {
                        this.model.serverId = main.id;
                        this.serverValue = serverElements.find((e) => e.value === main.id) ?? null;
                    }
                } else {
                    this.serverValue = serverElements.find((e) => e.value === this.model.serverId) ?? null;
                }
            }
        });
    }

    private loadMissions() {
        this.missionsService.getActiveMissions().pipe(first()).subscribe({
            next: (missions) => {
                const missionElements = missions.map((m) => ({ value: m.path, displayValue: `${m.name} · ${m.map}` }));
                this.missions$.next(missionElements);
                if (this.isEdit) {
                    this.missionValue = missionElements.find((e) => e.value === this.model.missionName) ?? null;
                }
            }
        });
    }

    private nextStandardOpTime(): Date {
        const now = new Date();
        const candidate = new Date(now);
        candidate.setHours(19, 0, 0, 0);
        if (now >= candidate) {
            candidate.setDate(candidate.getDate() + 1);
        }
        return candidate;
    }

    private formatTime(d: Date): string {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    submit() {
        if (!this.model.title || this.pending) {
            return;
        }
        this.pending = true;
        this.model.serverId = this.serverValue?.value ?? '';
        this.model.missionName = this.missionValue?.value ?? '';
        this.model.scheduledTime = this.combineDateTime();
        const request = this.isEdit ? this.campaignsService.updateOp(this.model) : this.campaignsService.addOp(this.model);
        request.pipe(first()).subscribe({
            next: () => this.dialogRef.close(true),
            error: (error) => {
                this.pending = false;
                this.dialog.open(MessageModalComponent, { data: { message: error?.error ?? 'Save failed' } });
            }
        });
    }

    private combineDateTime(): string {
        if (!this.scheduledDate) {
            return '';
        }
        const [h, m] = (this.scheduledTimeText || '19:00').split(':').map((x) => parseInt(x, 10));
        const d = new Date(this.scheduledDate);
        d.setHours(isNaN(h) ? 19 : h, isNaN(m) ? 0 : m, 0, 0);
        return d.toISOString();
    }

    cancel() {
        this.dialogRef.close();
    }
}
