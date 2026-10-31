import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatCard } from '@angular/material/card';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelContent } from '@angular/material/expansion';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { first, takeUntil } from 'rxjs/operators';

import { DestroyableComponent } from '@app/shared/components/destroyable/destroyable.component';
import { MissionsService } from '../../services/missions.service';
import { ServersHubService } from '../../services/servers-hub.service';
import { Mission } from '../../models/game-server';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '@app/shared/components/content-areas/main-content-area/main-content-area.component';
import { FileDropComponent } from '@app/shared/components/elements/file-drop/file-drop.component';
import { FlexFillerComponent } from '@app/shared/components/elements/flex-filler/flex-filler.component';
import { FileSizePipe } from '@app/shared/pipes/file-size.pipe';
import { SpotlightDirective } from '@app/shared/directives/spotlight.directive';
import { TextInputBoxedComponent } from '@app/shared/components/elements/text-input-boxed/text-input-boxed.component';
import { FormsModule } from '@angular/forms';
import { UksfError } from '@app/shared/models/response';
import { UrlQueryState } from '@app/shared/utils/url-query-state';
import { mapBorderColour as getMapBorderColour, capitaliseMapName } from '../../utils/map-colour';
import { groupMissionsByMap, mapLabelFontSize, MISSION_SORT_DEFINITIONS, MissionGroup, missionMatches, MissionSortDefinition, MissionSortDirection, MissionSortField, sortMissions } from '../../utils/mission-list';
import { confirmDroppedPbos, DroppedFile, saveBlob, showMissionError, showMissionReports, splitDroppedPbos } from '../../utils/mission-upload-dialogs';

export type { MissionGroup } from '../../utils/mission-list';

@Component({
    selector: 'app-operations-missions',
    templateUrl: './operations-missions.component.html',
    styleUrls: ['./operations-missions.component.scss'],
    imports: [
        DatePipe,
        MatCard,
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        MatExpansionPanelContent,
        MatButton,
        MatIconButton,
        MatMenu,
        MatMenuItem,
        MatMenuTrigger,
        MatIcon,
        MatTooltip,
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        FileDropComponent,
        FlexFillerComponent,
        FileSizePipe,
        SpotlightDirective,
        TextInputBoxedComponent,
        FormsModule
    ]
})
export class OperationsMissionsComponent extends DestroyableComponent implements OnInit {
    private missionsService = inject(MissionsService);
    private serversHub = inject(ServersHubService);
    private dialog = inject(MatDialog);

    @ViewChild('uploader') uploader!: ElementRef;
    @ViewChild('missionsContainer') missionsContainer!: ElementRef<HTMLElement>;

    activeMissions: Mission[] = [];
    archivedMissions: Mission[] = [];
    activeGroups: MissionGroup[] = [];
    archivedGroups: MissionGroup[] = [];
    filteredActiveMissions: Mission[] = [];
    filteredArchivedMissions: Mission[] = [];
    filteredActiveGroups: MissionGroup[] = [];
    filteredArchivedGroups: MissionGroup[] = [];
    private urlState = new UrlQueryState();
    filterString = this.urlState.string('filter');
    sortField: MissionSortField = this.urlState.oneOf('sort', ['name', 'date', 'map'] as const, 'date');
    sortDirection: MissionSortDirection = this.urlState.oneOf('dir', ['asc', 'desc'] as const, 'desc');
    groupByMap = this.urlState.flag('group');
    uploading = false;
    fileDragging = false;
    dropZoneHeight = 0;
    dropZoneWidth = 0;

    sortDefinitions = MISSION_SORT_DEFINITIONS;
    mapFontSize = mapLabelFontSize;

    mapBorderColour(map: string): string {
        return getMapBorderColour(map);
    }

    capitalise(map: string): string {
        return capitaliseMapName(map);
    }

    private onReceiveMissionsUpdate = (missions: Mission[]) => {
        this.setActiveMissions(missions);
        this.loadArchivedMissions();
    };

    ngOnInit() {
        this.serversHub.connect();
        this.serversHub.on('ReceiveMissionsUpdate', this.onReceiveMissionsUpdate);
        this.serversHub.reconnected$.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => this.loadMissions()
        });
        this.loadMissions();
    }

    override ngOnDestroy() {
        this.serversHub.off('ReceiveMissionsUpdate', this.onReceiveMissionsUpdate);
        this.serversHub.disconnect();
        super.ngOnDestroy();
    }

    onFilterChanged() {
        this.applyFilter();
        this.writeUrlState();
    }

    private writeUrlState() {
        this.urlState.set({ filter: this.filterString, sort: this.sortField, dir: this.sortDirection, group: this.groupByMap });
    }

    private applyFilter() {
        const matches = missionMatches(this.filterString);
        this.filteredActiveMissions = this.activeMissions.filter(matches);
        this.filteredArchivedMissions = this.archivedMissions.filter(matches);
        this.filteredActiveGroups = groupMissionsByMap(this.filteredActiveMissions);
        this.filteredArchivedGroups = groupMissionsByMap(this.filteredArchivedMissions);
    }

    loadMissions() {
        this.loadActiveMissions();
        this.loadArchivedMissions();
    }

    sort(field: MissionSortField, direction: MissionSortDirection) {
        this.sortField = field;
        this.sortDirection = direction;
        this.activeMissions = this.sorted(this.activeMissions);
        this.archivedMissions = this.sorted(this.archivedMissions);
        this.recomputeGroups();
        this.applyFilter();
        this.writeUrlState();
    }

    toggleGroupByMap() {
        this.groupByMap = !this.groupByMap;
        this.writeUrlState();
    }

    trackBySortName(_index: number, def: MissionSortDefinition): string {
        return def.name;
    }

    uploadFromButton(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.upload(input.files);
        }
    }

    onFileOver() {
        if (!this.fileDragging) {
            const rect = this.missionsContainer.nativeElement.getBoundingClientRect();
            const viewportBottomPadding = 16;
            this.dropZoneHeight = Math.min(rect.height, window.innerHeight - rect.top - viewportBottomPadding);
            this.dropZoneWidth = rect.width;
            this.fileDragging = true;
        }
    }

    onFileLeave() {
        this.resetDropZone();
    }

    onFileDrop(event: { files: DroppedFile[] }) {
        this.resetDropZone();
        splitDroppedPbos(event.files, (pboFiles, invalidFiles) => confirmDroppedPbos(this.dialog, pboFiles, invalidFiles, (files) => this.upload(files)));
    }

    resetDropZone() {
        this.fileDragging = false;
        this.dropZoneHeight = 0;
        this.dropZoneWidth = 0;
    }

    download(mission: Mission) {
        this.missionsService.downloadMission(mission.path).pipe(first()).subscribe({
            next: (blob) => saveBlob(blob, mission.path)
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
                this.archivedMissions = this.sorted(missions);
                this.archivedGroups = groupMissionsByMap(this.archivedMissions);
                this.applyFilter();
            }
        });
    }

    private setActiveMissions(missions: Mission[]) {
        this.activeMissions = this.sorted(missions);
        this.activeGroups = groupMissionsByMap(this.activeMissions);
        this.applyFilter();
    }

    private recomputeGroups() {
        this.activeGroups = groupMissionsByMap(this.activeMissions);
        this.archivedGroups = groupMissionsByMap(this.archivedMissions);
    }

    private sorted(missions: Mission[]): Mission[] {
        return sortMissions(missions, this.sortField, this.sortDirection);
    }

    private upload(files: FileList | File[]) {
        if (files.length === 0) return;

        const formData = new FormData();
        for (const file of Array.from(files)) {
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
                    showMissionReports(this.dialog, [...response.missionReports]);
                }
                this.loadMissions();
            },
            error: (error: UksfError) => {
                this.uploading = false;
                if (this.uploader) {
                    this.uploader.nativeElement.value = '';
                }
                showMissionError(this.dialog, error, 'Max size for all selected files is 50MB');
            }
        });
    }


}
