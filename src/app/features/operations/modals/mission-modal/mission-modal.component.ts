import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { BehaviorSubject } from 'rxjs';
import { first } from 'rxjs/operators';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { DropdownComponent } from '@app/shared/components/elements/dropdown/dropdown.component';
import { DateInputComponent } from '@app/shared/components/elements/date-input/date-input.component';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { CampaignMission, CampaignMissionStatus } from '../../models/campaign';
import { CampaignsService } from '../../services/campaigns.service';
import { GameServersService } from '../../services/game-servers.service';
import { GameServerOption } from '../../models/game-server';
import { MissionsService } from '../../services/missions.service';
import { TemplateFormValueDebugComponent } from '@app/shared/components/elements/form-value-debug/form-value-debug.component';

interface MissionModalData {
    campaignId: string;
    operationId: string;
    mission?: CampaignMission;
}

@Component({
    selector: 'app-mission-modal',
    templateUrl: './mission-modal.component.html',
    styleUrls: ['./mission-modal.component.scss'],
    imports: [FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions, TextInputComponent, DropdownComponent, DateInputComponent, ButtonComponent, MatCheckbox, TemplateFormValueDebugComponent]
})
export class MissionModalComponent {
    private dialogRef = inject<MatDialogRef<MissionModalComponent>>(MatDialogRef);
    private dialog = inject(MatDialog);
    private campaignsService = inject(CampaignsService);
    private gameServersService = inject(GameServersService);
    private missionsService = inject(MissionsService);
    private data = inject<MissionModalData>(MAT_DIALOG_DATA);

    isEdit = false;
    pending = false;
    model: CampaignMission = { id: '', operationId: '', title: '', scheduledTime: '', serverId: '', missionName: '', warno: '', status: CampaignMissionStatus.Scheduled, autoLaunch: false };

    scheduledDate: Date | null = null;
    scheduledTimeText = '19:00';

    servers$ = new BehaviorSubject<IDropdownElement[]>([]);
    missions$ = new BehaviorSubject<IDropdownElement[]>([]);
    serverValue: IDropdownElement | null = null;
    missionValue: IDropdownElement | null = null;

    constructor() {
        this.model.operationId = this.data.operationId;
        if (this.data.mission) {
            this.isEdit = true;
            this.model = { ...this.data.mission };
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
                    const main =
                        update.servers.find((s) => s.name === 'Main Server') ??
                        update.servers.find((s) => s.serverOption === GameServerOption.Singleton) ??
                        update.servers[0];
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
        const daysUntilSaturday = (6 - candidate.getDay() + 7) % 7;
        candidate.setDate(candidate.getDate() + daysUntilSaturday);
        if (now >= candidate) {
            candidate.setDate(candidate.getDate() + 7);
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
        const request = this.isEdit
            ? this.campaignsService.updateMission(this.data.campaignId, this.data.operationId, this.model)
            : this.campaignsService.addMission(this.data.campaignId, this.data.operationId, this.model);
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
}
