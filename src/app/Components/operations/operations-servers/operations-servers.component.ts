import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { AddServerModalComponent } from 'app/Modals/operations/add-server-modal/add-server-modal.component';
import { EditServerModsModalComponent } from 'app/Modals/operations/edit-server-mods-modal/edit-server-mods-modal.component';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { ValidationReportModalComponent } from 'app/Modals/multiple-message-modal/validation-report-modal.component';
import { Observable } from 'rxjs';
import { ConnectionContainer, SignalRService } from 'app/Services/signalr.service';
import { Permissions } from 'app/Services/permissions';
import { PermissionsService } from 'app/Services/permissions.service';
import { UksfError } from '../../../Models/Response';

@Component({
    selector: 'app-operations-servers',
    templateUrl: './operations-servers.component.html',
    styleUrls: ['../../../Pages/operations-page/operations-page.component.scss', './operations-servers.component.css'],
})
export class OperationsServersComponent implements OnInit, OnDestroy {
    static theme;
    @ViewChild('uploader') uploader: ElementRef;
    @ViewChild('serversContainer') serversContainer: ElementRef;
    admin;
    servers;
    disabled = false;
    missions;
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

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private signalrService: SignalRService, private permissions: PermissionsService) {
        this.getServers();
        this.getDisabledState();
    }

    ngOnInit() {
        window.setInterval(() => {
            this.refreshUptimes();
        }, 1000);

        this.hubConnection = this.signalrService.connect(`servers`);
        this.hubConnection.connection.on('ReceiveDisabledState', (state) => {
            this.disabled = state as boolean;
        });
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.getDisabledState();
        });
        this.admin = this.permissions.hasPermission(Permissions.ADMIN);
    }

    ngOnDestroy() {
        this.hubConnection.connection.stop();
    }

    getServers(skip = false) {
        if (this.updateRequest) {
            this.updateRequest.unsubscribe();
        }
        this.updating = true;
        this.updateRequest = this.httpClient.get(this.urls.apiUrl + '/gameservers').subscribe(
            (response) => {
                this.servers = response['servers'];
                this.missions = response['missions'];
                this.instanceCount = response['instanceCount'];
                if (skip) {
                    this.updating = false;
                    return;
                }
                this.servers.forEach((server) => {
                    this.refreshServerStatus(server);
                });
            },
            (_) => {
                this.updating = false;
            }
        );
    }

    refreshServerStatus(server) {
        if (server.request) {
            server.request.unsubscribe();
        }
        this.updating = true;
        server.updating = true;
        server.request = this.httpClient.get(`${this.urls.apiUrl}/gameservers/status/${server.id}`).subscribe(
            (response) => {
                const serverIndex = this.servers.findIndex((x) => x.id === response['gameServer'].id);
                this.servers[serverIndex] = response['gameServer'];
                this.instanceCount = response['instanceCount'];
                this.updating = false;
            },
            (_) => {
                server.updating = false;
                this.updating = false;
            }
        );
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
        this.httpClient.get(this.urls.apiUrl + '/gameservers/disabled').subscribe((state: boolean) => {
            this.disabled = state;
        });
    }

    toggleDisabledState() {
        this.httpClient.post(this.urls.apiUrl + '/gameservers/disabled', { state: !this.disabled }).subscribe();
    }

    get isDisabled() {
        return this.disabled && !this.admin;
    }

    addServer() {
        this.dialog
            .open(AddServerModalComponent, {})
            .afterClosed()
            .subscribe((_) => {
                this.getServers(true);
            });
    }

    editServer(event, server) {
        event.stopPropagation();
        this.dialog
            .open(AddServerModalComponent, {
                data: {
                    server: server,
                },
            })
            .afterClosed()
            .subscribe((environmentChanged: boolean) => {
                if (environmentChanged) {
                    this.dialog.open(MessageModalComponent, { data: { message: 'Server environment was changed. Selected mods for the server have been reset' } });
                }

                this.getServers(true);
            });
    }

    deleteServer(event, server) {
        event.stopPropagation();
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${server.name}'?` },
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.httpClient.delete(`${this.urls.apiUrl}/gameservers/${server.id}`).subscribe((response) => {
                this.servers = response;
            });
        });
    }

    onMove(event: CdkDragDrop<string[]>) {
        const before = JSON.stringify(this.servers);
        moveItemInArray(this.servers, event.previousIndex, event.currentIndex);
        if (before === JSON.stringify(this.servers)) {
            return;
        }
        this.updatingOrder = true;
        this.httpClient.post(`${this.urls.apiUrl}/gameservers/order`, this.servers).subscribe((response) => {
            this.servers = response;
            this.updatingOrder = false;
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
            })
            .subscribe(
                (response) => {
                    this.missions = response['missions'];
                    const missionReports = response['missionReports'];
                    this.uploadingFile = false;
                    this.uploader.nativeElement.value = '';
                    this.showMissionReport(missionReports);
                },
                (error) => {
                    this.uploadingFile = false;
                    this.uploader.nativeElement.value = '';
                    this.showError(error, 'Max size for all selected files is 10MB');
                }
            );
    }

    showMissionReport(missionReports: any[]) {
        const missionReport = missionReports.shift();
        let reportDialogClose: Observable<any>;
        if (missionReport.reports.length > 0) {
            reportDialogClose = this.dialog
                .open(ValidationReportModalComponent, {
                    data: { title: `Mission file: ${missionReport.mission}`, messages: missionReport.reports },
                })
                .afterClosed();
        } else {
            reportDialogClose = this.dialog
                .open(MessageModalComponent, {
                    data: { message: `Successfully uploaded '${missionReport.mission}'` },
                })
                .afterClosed();
        }
        reportDialogClose.subscribe((_) => {
            if (missionReports.length > 0) {
                this.showMissionReport(missionReports);
            }
        });
    }

    missionSelectionChange(event, server) {
        if (!event.isUserInput) {
            return;
        }
        server.missionSelection = event.source.value;
    }

    showError(error, customMessage = '') {
        let message = 'An error occured';
        if (customMessage) {
            message = customMessage;
        } else {
            if (error.error && typeof error.error === 'string') {
                message = error.error;
            } else if (error.message) {
                message = error.message;
            }
        }
        this.dialog.open(MessageModalComponent, {
            data: { message: message },
        });
    }

    launch(server) {
        server.updating = true;
        this.httpClient.post(`${this.urls.apiUrl}/gameservers/launch/${server.id}`, { missionName: server.missionSelection }).subscribe(
            (_) => {
                server.updating = false;
                this.refreshServerStatus(server);
            },
            (error: UksfError) => {
                if (error.statusCode === 400 && error.detailCode === 1 && error.validation != null) {
                    this.dialog.open(ValidationReportModalComponent, {
                        data: { title: error.error, messages: error.validation.reports },
                    });
                } else {
                    this.dialog.open(MessageModalComponent, {
                        data: { message: error.error },
                    });
                }
                server.updating = false;
                this.refreshServerStatus(server);
            }
        );
    }

    stop(server) {
        if (server.status.players > 0) {
            const dialog = this.dialog.open(ConfirmationModalComponent, {
                data: { message: `There are still ${server.status.players} players on '${server.name}'. Are you sure you want to stop the server?` },
            });
            dialog.componentInstance.confirmEvent.subscribe(() => {
                this.runStop(server);
            });
        } else {
            this.runStop(server);
        }
    }

    runStop(server) {
        server.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/gameservers/stop/${server.id}`).subscribe(
            (response) => {
                const serverIndex = this.servers.findIndex((x) => x.id === response['gameServer'].id);
                this.servers[serverIndex] = response['gameServer'];
                this.instanceCount = response['instanceCount'];
                this.servers[serverIndex].status.stopping = true;
            },
            (error) => {
                this.showError(error);
                server.updating = false;
                this.refreshServerStatus(server);
            }
        );
    }

    kill(server, skip = true) {
        if (skip) {
            this.runKill(server);
            return;
        }
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to kill '${server.name}'? This could have unexpected effects on the server` },
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.runKill(server);
        });
    }

    runKill(server) {
        server.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/gameservers/kill/${server.id}`).subscribe(
            (response) => {
                const serverIndex = this.servers.findIndex((x) => x.id === response['gameServer'].id);
                this.servers[serverIndex] = response['gameServer'];
                this.instanceCount = response['instanceCount'];
            },
            (error) => {
                this.showError(error);
                server.updating = false;
                this.refreshServerStatus(server);
            }
        );
    }

    killAll() {
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to kill ${this.instanceCount} servers?\nThere could be players still on and this could have unexpected effects on the server` },
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.httpClient.get(`${this.urls.apiUrl}/gameservers/killall`).subscribe(
                (_) => {
                    this.getServers();
                },
                (error) => {
                    this.showError(error);
                    this.getServers();
                }
            );
        });
    }

    editServerMods(event, server) {
        event.stopPropagation();
        this.dialog
            .open(EditServerModsModalComponent, {
                data: {
                    server: server,
                },
            })
            .afterClosed()
            .subscribe((_) => {
                this.getServers(true);
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
                data: { message: 'None of those files are PBOs files' },
            });
        } else {
            if (invalidFiles.length > 0) {
                let message = `Some of those files are not PBOs. Would you like to continue uploading the following files:\n`;
                pboFiles.forEach((file) => {
                    message += `\n${file.name}`;
                });
                const dialog = this.dialog.open(ConfirmationModalComponent, {
                    data: { message: message },
                });
                dialog.componentInstance.confirmEvent.subscribe(() => {
                    this.uploadFromDrop(pboFiles);
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

    onDragStarted(event) {
        event.source.element.nativeElement.classList.add(OperationsServersComponent.theme + '-theme');
    }

    onDragStopped(event) {
        event.item.element.nativeElement.classList.remove(OperationsServersComponent.theme + '-theme');
    }
}
