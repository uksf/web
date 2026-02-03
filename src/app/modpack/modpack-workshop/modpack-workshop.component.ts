import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { ConnectionContainer, SignalRService } from '../../Services/signalr.service';
import { InstallWorkshopModData, WorkshopMod, WorkshopModUpdatedDate } from '../models/WorkshopMod';
import { MessageModalComponent } from '../../Modals/message-modal/message-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { InstallWorkshopModModalComponent } from '../install-workshop-mod-modal/install-workshop-mod-modal.component';
import { WorkshopModInterventionModalComponent } from '../workshop-mod-intervention-modal/workshop-mod-intervention-modal.component';

@Component({
    selector: 'app-modpack-workshop',
    templateUrl: './modpack-workshop.component.html',
    styleUrls: ['../../modpack/modpack-page/modpack-page.component.scss', './modpack-workshop.component.scss', './modpack-workshop.component.scss-theme.scss']
})
export class ModpackWorkshopComponent implements OnInit {
    private hubConnection: ConnectionContainer;
    mods: WorkshopMod[] = [];

    constructor(private httpClient: HttpClient, private urls: UrlService, private signalrService: SignalRService, private dialog: MatDialog) {}

    ngOnInit() {
        this.getData(() => {
            this.mods.forEach((mod: WorkshopMod) => {
                this.getModUpdatedDate(mod);
            });
        });
        this.hubConnection = this.signalrService.connect(`modpack`);
        this.hubConnection.connection.on('ReceiveWorkshopModAdded', () => {
            this.getData();
        });
        this.hubConnection.connection.on('ReceiveWorkshopModUpdate', (id: string) => {
            this.getDataForMod(id);
        });
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.getData();
        });
    }

    getData(callback: () => void = null) {
        this.httpClient.get(this.urls.apiUrl + '/workshop').subscribe((mods: WorkshopMod[]) => {
            this.mods = mods;
            if (callback) {
                callback();
            }
        });
    }

    getDataForMod(id: string) {
        this.httpClient.get(this.urls.apiUrl + `/workshop/${id}`).subscribe((mod: WorkshopMod) => {
            const index: number = this.mods.findIndex((x: WorkshopMod) => x.id === mod.id);
            if (index === -1) {
                this.getData();
            } else {
                this.mods.splice(index, 1, mod);
            }
        });
    }

    getModUpdatedDate(mod: WorkshopMod) {
        this.httpClient.get(this.urls.apiUrl + `/workshop/${mod.steamId}/updatedDate`).subscribe((updatedDateResponse: WorkshopModUpdatedDate) => {
            mod.updatedDate = updatedDateResponse.updatedDate;
        });
    }

    interventionRequired(mod: WorkshopMod) {
        return mod.status === 'InterventionRequired';
    }

    updateAvailable(mod: WorkshopMod) {
        return mod.updatedDate !== null && this.isValidDate(mod.updatedDate) && this.isValidDate(mod.lastUpdatedLocally) && new Date(mod.updatedDate) > new Date(mod.lastUpdatedLocally);
    }

    canUninstall(mod: WorkshopMod) {
        return mod.status === 'InstalledPendingRelease' || mod.status === 'Installed' || mod.status === 'UpdatedPendingRelease' || mod.status === 'InterventionRequired' || mod.status === 'Error';
    }

    canDelete(mod: WorkshopMod) {
        return mod.status === 'Uninstalled';
    }

    hasError(mod: WorkshopMod) {
        return mod.status === 'Error';
    }

    install() {
        this.dialog.open(InstallWorkshopModModalComponent).componentInstance.installEvent.subscribe((data: InstallWorkshopModData) => {
            this.httpClient
                .post(this.urls.apiUrl + `/workshop`, {
                    steamId: data.steamId,
                    rootMod: data.rootMod,
                    folderName: data.folderName
                })
                .subscribe({
                    next: () => {},
                    error: (error: any) => {
                        this.dialog.open(MessageModalComponent, {
                            data: { message: error.error }
                        });
                    }
                });
        });
    }

    resolveIntervention(mod: WorkshopMod) {
        this.dialog
            .open(WorkshopModInterventionModalComponent, {
                data: {
                    availablePbos: mod.pbos
                }
            })
            .componentInstance.submitEvent.subscribe((selectedPbos: string[]) => {
                this.httpClient.post(this.urls.apiUrl + `/workshop/${mod.steamId}/resolve`, { selectedPbos: selectedPbos }).subscribe({
                    next: () => {},
                    error: (error: any) => {
                        this.dialog.open(MessageModalComponent, {
                            data: { message: error.error }
                        });
                    }
                });
            });
    }

    update(mod: WorkshopMod) {
        this.httpClient.post(this.urls.apiUrl + `/workshop/${mod.steamId}/update`, {}).subscribe(() => {});
    }

    uninstall(mod: WorkshopMod) {
        this.httpClient.post(this.urls.apiUrl + `/workshop/${mod.steamId}/uninstall`, {}).subscribe(() => {});
    }

    delete(mod: WorkshopMod) {
        this.httpClient.delete(this.urls.apiUrl + `/workshop/${mod.steamId}`).subscribe(() => {});
    }

    showError(mod: WorkshopMod) {
        this.dialog.open(MessageModalComponent, {
            data: { message: mod.errorMessage }
        });
    }

    trackBySteamId(_: any, mod: WorkshopMod) {
        return mod.steamId;
    }

    private isValidDate(date: string) {
        return date !== '0001-01-01T00:00:00.0000000Z';
    }
}
