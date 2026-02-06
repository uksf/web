import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { AddServerModalComponent } from '../../modals/add-server-modal/add-server-modal.component';
import { EditServerModsModalComponent } from '../../modals/edit-server-mods-modal/edit-server-mods-modal.component';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { ValidationReportModalComponent } from '@app/shared/modals/validation-report-modal/validation-report-modal.component';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConnectionContainer, SignalRService } from '@app/core/services/signalr.service';
import { Permissions } from '@app/core/services/permissions';
import { PermissionsService } from '@app/core/services/permissions.service';
import { UksfError } from '@app/shared/models/response';
import { IDropdownElement } from '@app/shared/components/elements/dropdown-base/dropdown-base.component';
import { OrderUpdateRequest } from '@app/shared/models/order-update-request';

@Component({
    selector: 'app-operations-servers',
    templateUrl: './operations-servers.component.html',
    styleUrls: ['../operations-page/operations-page.component.scss', './operations-servers.component.scss']
})
export class OperationsServersComponent implements OnInit, OnDestroy {
    @ViewChild('uploader') uploader: ElementRef;
    @ViewChild('serversContainer') serversContainer: ElementRef;
    missions: BehaviorSubject<IDropdownElement[]> = new BehaviorSubject<IDropdownElement[]>([]);
    admin;
    servers;
    disabled = false;
    updatingOrder = false;
    uploadingFile;
    updating;
    progress;
    message;
    instanceCount;
    updateRequest;
    fileDragging;
    dropZoneHeight = 0;
    dropZoneWidth = 0;
    private hubConnection: ConnectionContainer;
    private destroy$ = new Subject<void>();
    private uptimeInterval: number;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private signalrService: SignalRService, private permissions: PermissionsService) {}

    private get headers(): HttpHeaders {
        return new HttpHeaders({
            'Hub-Connection-Id': this.hubConnection.connection.connectionId
        });
    }

    ngOnInit() {
        this.admin = this.permissions.hasPermission(Permissions.ADMIN);

        this.hubConnection = this.signalrService.connect(`servers`);

        this.hubConnection.connection.on('ReceiveDisabledState', (state) => {
            this.disabled = state as boolean;
        });
        this.hubConnection.connection.on('ReceiveAnyUpdateIfNotCaller', (connectionId: string, skipRefresh: boolean) => {
            if (connectionId !== this.hubConnection.connection.connectionId) {
                this.getServers(skipRefresh);
            }
        });
        this.hubConnection.connection.on('ReceiveServerUpdateIfNotCaller', (connectionId: string, serverId: string) => {
            if (connectionId !== this.hubConnection.connection.connectionId) {
                const server = this.servers.find((server) => server.id === serverId);
                this.refreshServerStatus(server);
            }
        });
        this.hubConnection.connection.on('ReceiveMissionsUpdateIfNotCaller', (connectionId: string, missions: IMission[]) => {
            if (connectionId !== this.hubConnection.connection.connectionId) {
                this.missions.next(missions.map(this.mapMissionElement));
            }
        });
        this.hubConnection.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getServers();
                this.getDisabledState();
            }
        });

        this.getServers();
        this.getDisabledState();

        this.uptimeInterval = window.setInterval(() => {
            this.refreshUptimes();
        }, 1000);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.uptimeInterval) {
            clearInterval(this.uptimeInterval);
        }
        this.hubConnection.connection.stop().then();
    }

    getServers(skip = false) {
        if (this.updateRequest) {
            this.updateRequest.unsubscribe();
        }
        this.updating = true;
        this.updateRequest = this.httpClient.get(this.urls.apiUrl + '/gameservers').subscribe({
            next: (response) => {
                this.servers = response['servers'];
                this.instanceCount = response['instanceCount'];
                this.missions.next(response['missions'].map(this.mapMissionElement));

                if (skip) {
                    this.updating = false;
                    return;
                }
                this.servers.forEach((server) => {
                    this.refreshServerStatus(server);
                });
            },
            error: () => {
                this.updating = false;
            }
        });
    }

    refreshUptimes() {
        if (this.servers) {
            this.servers.forEach((server) => {
                if (server.status.parsedUptime && server.status.parsedUptime !== '00:00:00') {
                    const time = server.status.parsedUptime.split(':');
                    const seconds = time[2] === '59' ? 0 : parseInt(time[2], 10) + 1;
                    const minutes = time[1] === '59' && seconds === 0 ? 0 : seconds === 0 ? parseInt(time[1], 10) + 1 : parseInt(time[1], 10);
                    const hours = time[0] === '59' && minutes === 0 && seconds === 0 ? 0 : minutes === 0 && seconds === 0 ? parseInt(time[0], 10) + 1 : parseInt(time[0], 10);
                    server.status.parsedUptime = `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
                }
            });
        }
    }

    getServerStatus(server) {
        if (server.updating) {
            return 'Updating Status';
        }
        if (server.status.stopping) {
            return 'Stopping';
        }
        if (server.status.started) {
            return 'Started';
        }
        if (!server.status.running) {
            return 'Offline';
        }
        if (!server.status.mission) {
            return 'Launching';
        }
        if (server.status.parsedUptime === '00:00:00') {
            return 'Waiting';
        }
        return 'Running';
    }

    getDisabledState() {
        this.httpClient.get(this.urls.apiUrl + '/gameservers/disabled').pipe(takeUntil(this.destroy$)).subscribe({
            next: (state: boolean) => {
                this.disabled = state;
            }
        });
    }

    refreshServerStatus(server) {
        if (server.request) {
            server.request.unsubscribe();
        }
        this.updating = true;
        server.updating = true;
        server.request = this.httpClient.get(`${this.urls.apiUrl}/gameservers/status/${server.id}`).subscribe({
            next: (response) => {
                const serverIndex = this.servers.findIndex((x) => x.id === response['gameServer'].id);
                this.servers[serverIndex] = response['gameServer'];
                this.instanceCount = response['instanceCount'];
                this.updating = false;
            },
            error: () => {
                server.updating = false;
                this.updating = false;
            }
        });
    }

    get isDisabled() {
        return this.disabled && !this.admin;
    }

    addServer() {
        this.dialog
            .open(AddServerModalComponent, {})
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.getServers(true);
                }
            });
    }

    toggleDisabledState() {
        this.httpClient.post(this.urls.apiUrl + '/gameservers/disabled', { state: !this.disabled }, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe();
    }

    editServer(event, server) {
        event.stopPropagation();
        this.dialog
            .open(AddServerModalComponent, {
                data: {
                    server: server,
                    connectionId: this.hubConnection.connection.connectionId
                }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (environmentChanged: boolean) => {
                    if (environmentChanged) {
                        this.dialog.open(MessageModalComponent, { data: { message: 'Server environment was changed. Selected mods for the server have been reset' } });
                    }

                    this.getServers(true);
                }
            });
    }

    deleteServer(event, server) {
        event.stopPropagation();
        this.dialog
            .open(ConfirmationModalComponent, {
                data: { message: `Are you sure you want to delete '${server.name}'?` }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.httpClient.delete(`${this.urls.apiUrl}/gameservers/${server.id}`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
                            next: (response) => {
                                this.servers = response;
                            }
                        });
                    }
                }
            });
    }

    onMove(event: CdkDragDrop<string[]>) {
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        this.updatingOrder = true;
        moveItemInArray(this.servers, event.previousIndex, event.currentIndex);

        const body: OrderUpdateRequest = { previousIndex: event.previousIndex, newIndex: event.currentIndex };
        this.httpClient.patch(`${this.urls.apiUrl}/gameservers/order`, body, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                this.servers = response;
                this.updatingOrder = false;
            }
        });
    }

    showMissionReport(missionReports: any[]) {
        const missionReport = missionReports.shift();
        let reportDialogClose: Observable<any>;
        if (missionReport.reports.length > 0) {
            reportDialogClose = this.dialog
                .open(ValidationReportModalComponent, {
                    data: { title: `Mission file: ${missionReport.mission}`, messages: missionReport.reports }
                })
                .afterClosed();
        } else {
            reportDialogClose = this.dialog
                .open(MessageModalComponent, {
                    data: { message: `Successfully uploaded '${missionReport.mission}'` }
                })
                .afterClosed();
        }
        reportDialogClose.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                if (missionReports.length > 0) {
                    this.showMissionReport(missionReports);
                }
            }
        });
    }

    upload(files) {
        if (files.length === 0) {
            return;
        }

        const formData = new FormData();
        for (const file of files) {
            formData.append(file.name, file);
        }

        this.uploadingFile = true;
        this.httpClient
            .post(`${this.urls.apiUrl}/gameservers/mission`, formData, {
                reportProgress: true,
                headers: this.headers
            })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.missions.next(response['missions'].map(this.mapMissionElement));
                    const missionReports = response['missionReports'];
                    this.uploadingFile = false;
                    this.uploader.nativeElement.value = '';
                    this.showMissionReport(missionReports);
                },
                error: (error: UksfError) => {
                    this.uploadingFile = false;
                    this.uploader.nativeElement.value = '';
                    this.showError(error, 'Max size for all selected files is 50MB');
                }
            });
    }

    showError(error, fallbackMessage = '') {
        let message = 'An error occurred';
        if (error.error && typeof error.error === 'string') {
            message = error.error;
        } else if (error.message) {
            message = error.message;
        } else if (fallbackMessage) {
            message = fallbackMessage;
        }
        this.dialog.open(MessageModalComponent, {
            data: { message: message }
        });
    }

    stop(server) {
        if (server.status.players > 0) {
            this.dialog
                .open(ConfirmationModalComponent, {
                    data: { message: `There are still ${server.status.players} players on '${server.name}'. Are you sure you want to stop the server?` }
                })
                .afterClosed()
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (result) => {
                        if (result) {
                            this.runStop(server);
                        }
                    }
                });
        } else {
            this.runStop(server);
        }
    }

    launch(server) {
        server.updating = true;
        this.httpClient.post(`${this.urls.apiUrl}/gameservers/launch/${server.id}`, { missionName: server.missionSelection.value }, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                server.updating = false;
                this.refreshServerStatus(server);
            },
            error: (error: UksfError) => {
                if (error.statusCode === 400 && error.detailCode === 1 && error.validation != null) {
                    this.dialog.open(ValidationReportModalComponent, {
                        data: { title: error.error, messages: error.validation.reports }
                    });
                } else {
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error }
                    });
                }
                server.updating = false;
                this.refreshServerStatus(server);
            }
        });
    }

    kill(server, skip = true) {
        if (skip) {
            this.runKill(server);
            return;
        }
        this.dialog
            .open(ConfirmationModalComponent, {
                data: { message: `Are you sure you want to kill '${server.name}'? This could have unexpected effects on the server` }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.runKill(server);
                    }
                }
            });
    }

    runStop(server) {
        server.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/gameservers/stop/${server.id}`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                const serverIndex = this.servers.findIndex((x) => x.id === response['gameServer'].id);
                this.servers[serverIndex] = response['gameServer'];
                this.instanceCount = response['instanceCount'];
                this.servers[serverIndex].status.stopping = true;
            },
            error: (error) => {
                this.showError(error);
                server.updating = false;
                this.refreshServerStatus(server);
            }
        });
    }

    runKill(server) {
        server.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/gameservers/kill/${server.id}`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (response) => {
                const serverIndex = this.servers.findIndex((x) => x.id === response['gameServer'].id);
                this.servers[serverIndex] = response['gameServer'];
                this.instanceCount = response['instanceCount'];
            },
            error: (error) => {
                this.showError(error);
                server.updating = false;
                this.refreshServerStatus(server);
            }
        });
    }

    editServerMods(event, server) {
        event.stopPropagation();
        this.dialog
            .open(EditServerModsModalComponent, {
                data: {
                    server: server
                }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.getServers(true);
                }
            });
    }

    onFileOver() {
        if (!this.fileDragging) {
            const rect: DOMRect = this.serversContainer.nativeElement.getBoundingClientRect();
            this.dropZoneHeight = rect.height;
            this.dropZoneWidth = rect.width;
            this.fileDragging = true;
        }
    }

    onFileLeave() {
        if (this.fileDragging) {
            this.resetDropZone();
        }
    }

    onFileDrop(event) {
        this.resetDropZone();
        const files = event.files;
        const lastIndex = files.length - 1;
        const pboFiles = [];
        const invalidFiles = [];
        const regex = /(?:\.([^.]+))?$/;
        files.forEach((file, index) => {
            file.fileEntry.file((resolvedFile) => {
                const path = file.relativePath;
                const ext = regex.exec(path)[1];
                if (ext === 'pbo') {
                    pboFiles.push(resolvedFile);
                } else {
                    invalidFiles.push(resolvedFile);
                }
                if (index === lastIndex) {
                    this.fileDropFinished(pboFiles, invalidFiles);
                }
            });
        });
    }

    fileDropFinished(pboFiles, invalidFiles) {
        if (pboFiles.length === 0 && invalidFiles.length === 0) {
            return;
        }
        if (pboFiles.length === 0) {
            this.dialog.open(MessageModalComponent, {
                data: { message: 'None of those files are PBOs files' }
            });
        } else {
            if (invalidFiles.length > 0) {
                let message = `Some of those files are not PBOs. Would you like to continue uploading the following files:\n`;
                pboFiles.forEach((file) => {
                    message += `\n${file.name}`;
                });
                this.dialog
                    .open(ConfirmationModalComponent, {
                        data: { message: message }
                    })
                    .afterClosed()
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: (result) => {
                            if (result) {
                                this.uploadFromDrop(pboFiles);
                            }
                        }
                    });
            } else {
                this.uploadFromDrop(pboFiles);
            }
        }
    }

    uploadFromDrop(files) {
        this.upload(files);
    }

    resetDropZone() {
        this.fileDragging = false;
        this.dropZoneHeight = 0;
        this.dropZoneWidth = 0;
    }

    killAll() {
        this.dialog
            .open(ConfirmationModalComponent, {
                data: { message: `Are you sure you want to kill ${this.instanceCount} servers?\nThere could be players still on and this could have unexpected effects on the server` }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.httpClient.get(`${this.urls.apiUrl}/gameservers/killall`, { headers: this.headers }).pipe(takeUntil(this.destroy$)).subscribe({
                            next: () => {
                                this.getServers();
                            },
                            error: (error) => {
                                this.showError(error);
                                this.getServers();
                            }
                        });
                    }
                }
            });
    }

    onDragStarted(event) {
        event.source._dragRef._preview.classList.add('dark-theme');
        event.source.element.nativeElement.classList.add('dark-theme');
    }

    displayWithMission = (element: IDropdownElement): string => {
        if (!element) {
            return '';
        }

        const mission = this.mapMission(element);
        return this.missionFormatter(mission.name, mission.map);
    };

    missionFilter = (element: IDropdownElement, filter: string): boolean => {
        const mission = this.mapMission(element);
        return mission.name.toLowerCase().includes(filter) || mission.path.toLowerCase().includes(filter);
    };

    missionMatcher = (element: IDropdownElement, match: string): boolean => {
        const mission = this.mapMission(element);
        return this.missionFormatter(mission.name.toLowerCase(), mission.map.toLowerCase()) === match;
    };

    mapMission(dropdownElement: IDropdownElement): IMission {
        return {
            path: dropdownElement.value,
            name: dropdownElement.displayValue,
            map: dropdownElement.data
        };
    }

    mapMissionElement(mission: IMission): IDropdownElement {
        return {
            value: mission.path,
            displayValue: mission.name,
            data: mission.map
        };
    }

    missionFormatter(missionName: string, missionMap: string): string {
        return `${missionName}.${missionMap}`;
    }

    getMissionName(element: IDropdownElement): string {
        const mission = this.mapMission(element);
        return `${mission.map}, ${mission.name}`;
    }

    getMissionTooltip = (element: IDropdownElement): string => {
        const mission = this.mapMission(element);
        return `${mission.path}`;
    };
}

interface IMission {
    map: string;
    name: string;
    path: string;
}
