import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';

import { DestroyableComponent } from '@app/shared/components/destroyable/destroyable.component';
import { MissionsService } from '../../services/missions.service';
import { ServersHubService } from '../../services/servers-hub.service';
import { Mission, MissionReport } from '../../models/game-server';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { ValidationReportModalComponent } from '@app/shared/modals/validation-report-modal/validation-report-modal.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { FileDropComponent } from '@app/shared/components/elements/file-drop/file-drop.component';
import { FileSizePipe } from '@app/shared/pipes/file-size.pipe';
import { UksfError } from '@app/shared/models/response';

type SortField = 'name' | 'date' | 'map';
type SortDirection = 'asc' | 'desc';

export interface MissionGroup {
    map: string;
    missions: Mission[];
}

@Component({
    selector: 'app-operations-missions',
    templateUrl: './operations-missions.component.html',
    styleUrls: ['./operations-missions.component.scss'],
    imports: [
        DatePipe,
        NgTemplateOutlet,
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        MatIconButton,
        MatIcon,
        MatTooltip,
        FileDropComponent,
        FileSizePipe
    ]
})
export class OperationsMissionsComponent extends DestroyableComponent implements OnInit {
    private missionsService = inject(MissionsService);
    private serversHub = inject(ServersHubService);
    private dialog = inject(MatDialog);

    @ViewChild('uploader') uploader!: ElementRef;

    activeMissions: Mission[] = [];
    archivedMissions: Mission[] = [];
    activeGroups: MissionGroup[] = [];
    archivedGroups: MissionGroup[] = [];
    sortField: SortField = 'map';
    sortDirection: SortDirection = 'asc';
    groupByMap = false;
    uploading = false;
    fileDragging = false;

    private onReceiveMissionsUpdate = (connectionId: string, missions: Mission[]) => {
        if (connectionId !== this.serversHub.connectionId) {
            this.setActiveMissions(missions);
            this.loadArchivedMissions();
        }
    };

    ngOnInit() {
        this.serversHub.connect();
        this.serversHub.on('ReceiveMissionsUpdateIfNotCaller', this.onReceiveMissionsUpdate);
        this.serversHub.reconnected$.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this.loadMissions()
        });
        this.loadMissions();
    }

    override ngOnDestroy() {
        this.serversHub.off('ReceiveMissionsUpdateIfNotCaller', this.onReceiveMissionsUpdate);
        this.serversHub.disconnect();
        super.ngOnDestroy();
    }

    loadMissions() {
        this.loadActiveMissions();
        this.loadArchivedMissions();
    }

    setSort(field: SortField) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        this.activeMissions = this.sortMissions(this.activeMissions);
        this.archivedMissions = this.sortMissions(this.archivedMissions);
        this.recomputeGroups();
    }

    toggleGroupByMap() {
        this.groupByMap = !this.groupByMap;
    }

    uploadFromButton(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.upload(input.files);
        }
    }

    onFileOver() {
        this.fileDragging = true;
    }

    onFileLeave() {
        this.fileDragging = false;
    }

    onFileDrop(event: { files: { relativePath: string; fileEntry: { file: (cb: (f: File) => void) => void } }[] }) {
        this.fileDragging = false;
        const files = event.files;
        if (files.length === 0) return;

        const pboFiles: File[] = [];
        const invalidFiles: File[] = [];
        let resolved = 0;

        files.forEach((file) => {
            file.fileEntry.file((resolvedFile: File) => {
                const ext = file.relativePath.split('.').pop()?.toLowerCase();
                if (ext === 'pbo') {
                    pboFiles.push(resolvedFile);
                } else {
                    invalidFiles.push(resolvedFile);
                }
                resolved++;
                if (resolved === files.length) {
                    this.fileDropFinished(pboFiles, invalidFiles);
                }
            });
        });
    }

    download(mission: Mission) {
        this.missionsService.downloadMission(mission.path).pipe(first()).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = mission.path;
                anchor.click();
                URL.revokeObjectURL(url);
            }
        });
    }

    archive(mission: Mission) {
        this.missionsService.archiveMission(mission.path, this.serversHub.connectionId ?? '').pipe(first()).subscribe({
            next: () => this.loadMissions()
        });
    }

    restore(mission: Mission) {
        this.missionsService.restoreMission(mission.path, this.serversHub.connectionId ?? '').pipe(first()).subscribe({
            next: () => this.loadMissions()
        });
    }

    deleteMission(mission: Mission) {
        this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${mission.name}'?` }
        }).afterClosed().pipe(first()).subscribe({
            next: (confirmed) => {
                if (confirmed) {
                    this.missionsService.deleteMission(mission.path, this.serversHub.connectionId ?? '').pipe(first()).subscribe({
                        next: () => this.loadMissions()
                    });
                }
            }
        });
    }

    trackByMissionPath(_index: number, mission: Mission): string {
        return mission.path;
    }

    trackByMapGroup(_index: number, group: MissionGroup): string {
        return group.map;
    }

    private loadActiveMissions() {
        this.missionsService.getActiveMissions().pipe(first()).subscribe({
            next: (missions) => this.setActiveMissions(missions)
        });
    }

    private loadArchivedMissions() {
        this.missionsService.getArchivedMissions().pipe(first()).subscribe({
            next: (missions) => {
                this.archivedMissions = this.sortMissions(missions);
                this.archivedGroups = this.computeGroups(this.archivedMissions);
            }
        });
    }

    private setActiveMissions(missions: Mission[]) {
        this.activeMissions = this.sortMissions(missions);
        this.activeGroups = this.computeGroups(this.activeMissions);
    }

    private recomputeGroups() {
        this.activeGroups = this.computeGroups(this.activeMissions);
        this.archivedGroups = this.computeGroups(this.archivedMissions);
    }

    private computeGroups(missions: Mission[]): MissionGroup[] {
        const groupMap = new Map<string, Mission[]>();
        for (const mission of missions) {
            const existing = groupMap.get(mission.map);
            if (existing) {
                existing.push(mission);
            } else {
                groupMap.set(mission.map, [mission]);
            }
        }
        return Array.from(groupMap.entries())
            .map(([map, missionList]) => ({ map, missions: missionList }))
            .sort((a, b) => a.map.localeCompare(b.map));
    }

    private sortMissions(missions: Mission[]): Mission[] {
        return [...missions].sort((a, b) => {
            const dir = this.sortDirection === 'asc' ? 1 : -1;
            let result: number;
            switch (this.sortField) {
                case 'name':
                    result = a.name.localeCompare(b.name);
                    break;
                case 'date':
                    result = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
                    break;
                case 'map':
                default:
                    result = a.map.localeCompare(b.map) || a.name.localeCompare(b.name);
                    break;
            }
            return result * dir;
        });
    }

    private upload(files: FileList | File[]) {
        if (files.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            formData.append(file.name, file, file.name);
        }

        this.uploading = true;
        this.missionsService.uploadMission(formData, this.serversHub.connectionId ?? '').pipe(first()).subscribe({
            next: (response) => {
                this.uploading = false;
                if (this.uploader) {
                    this.uploader.nativeElement.value = '';
                }
                if (response.missionReports?.length > 0) {
                    this.showMissionReports([...response.missionReports]);
                }
                this.loadMissions();
            },
            error: (error: UksfError) => {
                this.uploading = false;
                if (this.uploader) {
                    this.uploader.nativeElement.value = '';
                }
                this.showError(error, 'Max size for all selected files is 50MB');
            }
        });
    }

    private showMissionReports(reports: MissionReport[]) {
        const report = reports.shift()!;
        let reportDialogClose: Observable<boolean>;
        if (report.reports.length > 0) {
            reportDialogClose = this.dialog.open(ValidationReportModalComponent, {
                data: { title: `Mission file: ${report.mission}`, messages: report.reports }
            }).afterClosed();
        } else {
            reportDialogClose = this.dialog.open(MessageModalComponent, {
                data: { message: `Successfully uploaded '${report.mission}'` }
            }).afterClosed();
        }
        reportDialogClose.pipe(first()).subscribe({
            next: () => {
                if (reports.length > 0) {
                    this.showMissionReports(reports);
                }
            }
        });
    }

    private showError(error: UksfError, fallbackMessage = '') {
        let message = 'An error occurred';
        if (error.error && typeof error.error === 'string') {
            message = error.error;
        } else if (fallbackMessage) {
            message = fallbackMessage;
        }
        this.dialog.open(MessageModalComponent, { data: { message } });
    }

    private fileDropFinished(pboFiles: File[], invalidFiles: File[]) {
        if (pboFiles.length === 0 && invalidFiles.length === 0) return;

        if (pboFiles.length === 0) {
            this.dialog.open(MessageModalComponent, {
                data: { message: 'None of those files are PBO files' }
            });
        } else if (invalidFiles.length > 0) {
            let message = 'Some of those files are not PBOs. Would you like to continue uploading the following files:\n';
            pboFiles.forEach((file) => { message += `\n${file.name}`; });
            this.dialog.open(ConfirmationModalComponent, {
                data: { message }
            }).afterClosed().pipe(first()).subscribe({
                next: (result) => {
                    if (result) {
                        this.upload(pboFiles);
                    }
                }
            });
        } else {
            this.upload(pboFiles);
        }
    }
}
