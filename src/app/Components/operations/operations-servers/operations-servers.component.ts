import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material';
import { AddServerModalComponent } from 'app/Modals/operations/add-server-modal/add-server-modal.component';
import { EditServerModsModalComponent } from 'app/Modals/operations/edit-server-mods-modal/edit-server-mods-modal.component';
import { ConfirmationModalComponent } from 'app/Modals/confirmation-modal/confirmation-modal.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import { MultipleMessageModalComponent } from 'app/Modals/multiple-message-modal/multiple-message-modal.component';
import { Observable } from 'rxjs';
import { ConnectionContainer, SignalRService } from 'app/Services/signalr.service';
import { Permissions } from 'app/Services/permissions';
import { NgxPermissionsService } from 'ngx-permissions';

@Component({
    selector: 'app-operations-servers',
    templateUrl: './operations-servers.component.html',
    styleUrls: ['../../../Pages/operations-page/operations-page.component.scss', './operations-servers.component.scss']
})
export class OperationsServersComponent implements OnInit, OnDestroy {
    static theme;
    @ViewChild('uploader', { static: false }) uploader: ElementRef;
    @ViewChild('serversContainer', { static: false }) serversContainer: ElementRef;
    admin;
    disabled = false;
    updatingOrder = false;
    uploadingFile;
    servers = new Array<GameServer>();
    statuses = new Array<GameServerStatus>();
    missions;
    progress;
    message;
    fileDragging;
    dropZoneHeight = 0;
    dropZoneWidth = 0;
    private hubConnection: ConnectionContainer;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private signalrService: SignalRService, private permissions: NgxPermissionsService) { }

    ngOnInit() {
        this.hubConnection = this.signalrService.connect('gameservers?key=all');
        this.hubConnection.connection.on('ReceiveServerAdded', (server: GameServer) => {
            console.log(`Server added ${server.name}`);
            this.servers.push(server);
            this.servers.sort((x, y) => x.order - y.order)
        });
        this.hubConnection.connection.on('ReceiveServerUpdate', (server: GameServer) => {
            console.log(`Server updated ${server.name}`);
            const index = this.servers.findIndex((x: GameServer) => this.serverKey(x) === this.serverKey(server));
            if (index > -1) {
                this.servers[index] = server;
            } else {
                this.servers.push(server);
            }
        });
        this.hubConnection.connection.on('ReceiveServersUpdate', (servers: GameServer[]) => {
            console.log('Servers updated');
            this.servers = servers;
        });
        this.hubConnection.connection.on('ReceiveServerRemoved', (key: string) => {
            console.log(`Server removed ${key}`);
            const index = this.servers.findIndex(x => this.serverKey(x) === key);
            if (index > -1) {
                this.servers.splice(index, 1);
            }
        });
        this.hubConnection.connection.on('ReceiveDisabledState', (state: boolean) => {
            console.log(`Disabled state changed to ${state}`);
            this.disabled = state;
        });
        this.hubConnection.connection.on('ReceiveServerStatusUpdate', (status: GameServerStatus) => {
            console.log(`Status update ${this.statusKey(status)}`);
            const index = this.statuses.findIndex(x => this.statusKey(x) === this.statusKey(status));
            if (index > -1) {
                this.statuses[index] = status;
            } else {
                this.statuses.push(status);
            }
        });
        this.hubConnection.connection.on('ReceiveServerStatusesUpdate', (statuses: GameServerStatus[]) => {
            console.log('Statuses update');
            this.statuses = statuses;
        });
        this.hubConnection.connection.on('ReceiveServerStatusRemoved', (key: string) => {
            console.log(`Status removed ${key}`);
            const index = this.statuses.findIndex(x => this.statusKey(x) === key);
            if (index > -1) {
                this.statuses.splice(index, 1);
            }
        });
        this.hubConnection.connection.on('ReceiveServerStatusesCleared', () => {
            console.log('Statuses cleared');
            this.statuses = new Array<GameServerStatus>();
        });
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.getServers();
            this.getDisabledState();
        });
        this.admin = this.permissions.getPermissions()[Permissions.ADMIN];

        this.getServers();
        this.getDisabledState();
    }

    ngOnDestroy() {
        this.hubConnection.connection.stop();
    }

    getServers() {
        this.httpClient.get(this.urls.apiUrl + '/gameservers').subscribe(response => {
            this.servers = response['servers'];
            this.statuses = response['statuses'];
            this.missions = response['missions'];
        });
    }

    isRunning(server: GameServer): boolean {
        return this.statuses.findIndex(x => this.statusKey(x) === this.serverKey(server)) > -1
    }

    getStatus(server: GameServer): GameServerStatus {
        return this.statuses.find(x => this.statusKey(x) === this.serverKey(server));
    }

    getUptime(status: GameServerStatus): string {
        if (status.uptime > 0) {
            const hours = Math.floor(status.uptime / 3600);
            const minutes = Math.floor(status.uptime / 60) % 60;
            const seconds = status.uptime % 60;
            return [hours, minutes, seconds].map(x => x < 10 ? '0' + x : x).filter((x, i) => x !== '00' || i > 0).join(':')
        }
        return '';
    }

    getServerStatus(server: GameServer) {
        const status = this.getStatus(server);
        if (status) {
            switch (+status.state) {
                case GameServerState.NOT_RUNNING: return 'Not Running';
                case GameServerState.NOT_RESPONDING: return 'Not Responding';
                case GameServerState.MISSION_RECEIVED: return 'Waiting';
                default: return 'Offline';
            }
            // if (server.status.stopping) {
            //     return 'Stopping';
            // }
            // if (server.status.started) {
            //     return 'Started';
            // }
            // if (!server.status.running) {
            //     return 'Offline';
            // }
            // if (!server.status.mission) {
            //     return 'Launching';
            // }
            // if (server.status.parsedUptime === '00:00:00') {
            //     return 'Waiting';
            // }
            // if (server.updating) {
            //     return 'Updating Status';
            // }
        }
        return 'No State';
    }

    getDisabledState() {
        this.httpClient.get(this.urls.apiUrl + '/gameservers/disabled').subscribe((state: boolean) => {
            this.disabled = state;
        });
    }

    toggleDisabledState() {
        this.httpClient.post(this.urls.apiUrl + '/gameservers/disable', { state: !this.disabled }).subscribe();
    }

    get isDisabled() {
        return this.disabled && !this.admin;
    }

    addServer() {
        this.dialog.open(AddServerModalComponent, {}).afterClosed().subscribe(_ => { });
    }

    editServer(event, server: GameServer) {
        event.stopPropagation();
        this.dialog.open(AddServerModalComponent, {
            data: {
                server: server
            }
        }).afterClosed().subscribe(_ => { });
    }

    deleteServer(event, server: GameServer) {
        event.stopPropagation();
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to delete '${server.name}'?` }
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.httpClient.delete(`${this.urls.apiUrl}/gameservers/${server.id}`).subscribe(response => { });
        });
    }

    onMove(event: CdkDragDrop<string[]>) {
        const before = JSON.stringify(this.servers);
        moveItemInArray(this.servers, event.previousIndex, event.currentIndex);
        if (before === JSON.stringify(this.servers)) { return; }
        this.updatingOrder = true;
        this.httpClient.post(`${this.urls.apiUrl}/gameservers/order`, this.servers).subscribe(() => {
            this.updatingOrder = false;
        }, _ => {
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
        this.httpClient.post(`${this.urls.apiUrl}/gameservers/mission`, formData, {
            reportProgress: true,
        }).subscribe(response => {
            this.missions = response['missions'];
            const missionReports = response['missionReports'];
            this.uploadingFile = false;
            this.uploader.nativeElement.value = '';
            this.showMissionReport(missionReports);
        }, error => {
            this.uploadingFile = false;
            this.uploader.nativeElement.value = '';
            this.showError(error, 'Max size for all selected files is 10MB');
        });
    }

    showMissionReport(missionReports: any[]) {
        const missionReport = missionReports.shift();
        let reportDialogClose: Observable<any>;
        if (missionReport.reports.length > 0) {
            reportDialogClose = this.dialog.open(MultipleMessageModalComponent, {
                data: { title: `Mission file: ${missionReport.mission}`, messages: missionReport.reports }
            }).afterClosed();
        } else {
            reportDialogClose = this.dialog.open(MessageModalComponent, {
                data: { message: `Successfully uploaded '${missionReport.mission}'` }
            }).afterClosed();
        }
        reportDialogClose.subscribe(_ => {
            if (missionReports.length > 0) {
                this.showMissionReport(missionReports);
            }
        });
    }

    missionSelectionChange(event, server: GameServer) {
        if (!event.isUserInput) { return; }
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
            data: { message: message }
        });
    }

    launch(server: GameServer) {
        server.updating = true;
        this.httpClient.post(`${this.urls.apiUrl}/gameservers/launch/${server.id}`, { missionName: server.missionSelection }).subscribe(_ => {
            server.updating = false;
        }, rawError => {
            const error = rawError['error'];
            if (error.reports && error.reports.length > 0) {
                this.dialog.open(MultipleMessageModalComponent, {
                    data: { title: error.message, messages: error.reports }
                });
            } else {
                this.dialog.open(MessageModalComponent, {
                    data: { message: error.message }
                });
            }
            server.updating = false;
        });
    }

    stop(server: GameServer) {
        if (this.isRunning(server)) {
            const status = this.getStatus(server);
            const dialog = this.dialog.open(ConfirmationModalComponent, {
                data: { message: `There are still ${status.playerCount} players on '${server.name}'. Are you sure you want to stop the server?` }
            });
            dialog.componentInstance.confirmEvent.subscribe(() => {
                this.runStop(server);
            });
        } else {
            this.runStop(server);
        }
    }

    runStop(server: GameServer) {
        server.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/gameservers/stop/${server.id}`).subscribe(response => {
            const serverIndex = this.servers.findIndex(x => x.id === response['gameServer'].id);
            this.servers[serverIndex] = response['gameServer'];
            // this.servers[serverIndex].status.stopping = true;
        }, error => {
            this.showError(error);
            server.updating = false;
        });
    }

    kill(server: GameServer, skip = true) {
        if (skip) {
            this.runKill(server);
            return;
        }
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to kill '${server.name}'? This could have unexpected effects on the server` }
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.runKill(server);
        });
    }

    runKill(server: GameServer) {
        server.updating = true;
        this.httpClient.get(`${this.urls.apiUrl}/gameservers/kill/${server.id}`).subscribe(response => {
            const serverIndex = this.servers.findIndex(x => x.id === response['gameServer'].id);
            this.servers[serverIndex] = response['gameServer'];
        }, error => {
            this.showError(error);
            server.updating = false;
        });
    }

    killAll() {
        const dialog = this.dialog.open(ConfirmationModalComponent, {
            data: { message: `Are you sure you want to kill ${this.statuses.length} servers? There could be players still on and this could have unexpected effects on the server` }
        });
        dialog.componentInstance.confirmEvent.subscribe(() => {
            this.httpClient.get(`${this.urls.apiUrl}/gameservers/killall`).subscribe(_ => {
                this.getServers();
            }, error => {
                this.showError(error);
                this.getServers();
            });
        });
    }

    editServerMods(event, server: GameServer) {
        event.stopPropagation();
        this.dialog.open(EditServerModsModalComponent, {
            data: {
                server: server
            }
        }).afterClosed().subscribe(_ => { });
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
            file.fileEntry.file(resolvedFile => {
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
        if (pboFiles.length === 0 && invalidFiles.length === 0) { return; }
        if (pboFiles.length === 0) {
            this.dialog.open(MessageModalComponent, {
                data: { message: 'None of those files are PBOs files' }
            });
        } else {
            if (invalidFiles.length > 0) {
                let message = `Some of those files are not PBOs. Would you like to continue uploading the following files:\n`;
                pboFiles.forEach(file => {
                    message += `\n${file.name}`;
                });
                const dialog = this.dialog.open(ConfirmationModalComponent, {
                    data: { message: message }
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

    serverKey(server: GameServer): string {
        return `${server.port}:0:${server.name}`
    }

    statusKey(status: GameServerStatus): string {
        return `${status.port}:${status.type}:${status.name}`
    }
}

export class GameServer {
    id: string;
    adminPassword: string;
    hostName: string;
    mods = [];
    name: string;
    numberHeadlessClients: number;
    order = 0;
    password: string;
    port: number;
    profileName: string;
    serverMods: string;
    serverOption = 0;
    missionSelection: string;
    updating = false;
}

export class GameServerStatus {
    timestamp: Date;
    port: number;
    type = 0;
    name: string;
    processId = 0;
    state: GameServerState = GameServerState.NONE;
    map: string;
    mission: string;
    uptime = 0;
    missionUptime = 0;
    playerCount: number;
    playerMap = [];
}

// https://community.bistudio.com/wiki/getClientStateNumber
export enum GameServerState {
    NOT_RUNNING = -2,
    NOT_RESPONDING = -1,
    NONE,
    CREATED,
    CONNECTED,
    LOGGED_IN,
    MISSION_SELECTED,
    MISSION_ASKED,
    ROLE_ASSIGNED,
    MISSION_RECEIVED,
    GAME_LOADED,
    BRIEFING_SWOWN,
    BRIEFING_READ,
    GAME_FINISHED,
    DEBRIEFING_READ
}
