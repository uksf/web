import { Component, OnDestroy, OnInit } from '@angular/core';
import { first, takeUntil } from 'rxjs/operators';
import { ConnectionContainer, SignalRService } from '@app/core/services/signalr.service';
import { InstallWorkshopModData, WorkshopMod } from '../models/workshop-mod';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { UksfError } from '@app/shared/models/response';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { InstallWorkshopModModalComponent } from '../install-workshop-mod-modal/install-workshop-mod-modal.component';
import { WorkshopModInterventionModalComponent } from '../workshop-mod-intervention-modal/workshop-mod-intervention-modal.component';
import { WorkshopService } from '../services/workshop.service';
import { DestroyableComponent } from '@app/shared/components';

@Component({
    selector: 'app-modpack-workshop',
    templateUrl: './modpack-workshop.component.html',
    styleUrls: ['../modpack-page/modpack-page.component.scss', './modpack-workshop.component.scss', './modpack-workshop.component.scss-theme.scss']
})
export class ModpackWorkshopComponent extends DestroyableComponent implements OnInit, OnDestroy {
    private hubConnection: ConnectionContainer;
    private onReceiveWorkshopModAdded = () => this.getData();
    private onReceiveWorkshopModUpdate = (id: string) => this.getDataForMod(id);
    mods: WorkshopMod[] = [];

    constructor(private workshopService: WorkshopService, private signalrService: SignalRService, private dialog: MatDialog) {
        super();
    }

    ngOnInit() {
        this.getData(() => {
            this.mods.forEach((mod: WorkshopMod) => {
                this.getModUpdatedDate(mod);
            });
        });
        this.hubConnection = this.signalrService.connect(`modpack`);
        this.hubConnection.connection.on('ReceiveWorkshopModAdded', this.onReceiveWorkshopModAdded);
        this.hubConnection.connection.on('ReceiveWorkshopModUpdate', this.onReceiveWorkshopModUpdate);
        this.hubConnection.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getData();
            }
        });
    }

    override ngOnDestroy() {
        super.ngOnDestroy();
        this.hubConnection.connection.off('ReceiveWorkshopModAdded', this.onReceiveWorkshopModAdded);
        this.hubConnection.connection.off('ReceiveWorkshopModUpdate', this.onReceiveWorkshopModUpdate);
        this.hubConnection.connection.stop();
    }

    getData(callback: () => void = null) {
        this.workshopService.getMods().pipe(first()).subscribe({
            next: (mods: WorkshopMod[]) => {
                this.mods = mods;
                if (callback) {
                    callback();
                }
            }
        });
    }

    getDataForMod(id: string) {
        this.workshopService.getMod(id).pipe(first()).subscribe({
            next: (mod: WorkshopMod) => {
                const index: number = this.mods.findIndex((x: WorkshopMod) => x.id === mod.id);
                if (index === -1) {
                    this.getData();
                } else {
                    this.mods.splice(index, 1, mod);
                }
            }
        });
    }

    getModUpdatedDate(mod: WorkshopMod) {
        this.workshopService.getModUpdatedDate(mod.steamId).pipe(first()).subscribe({
            next: (updatedDateResponse) => {
                mod.updatedDate = updatedDateResponse.updatedDate;
            }
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
        this.dialog.open(InstallWorkshopModModalComponent).afterClosed().pipe(first()).subscribe({
            next: (data: InstallWorkshopModData) => {
                if (data) {
                    this.workshopService.installMod(data).pipe(first()).subscribe({
                        next: () => {},
                        error: (error: UksfError) => {
                            this.dialog.open(MessageModalComponent, {
                                data: { message: error.error }
                            });
                        }
                    });
                }
            }
        });
    }

    resolveIntervention(mod: WorkshopMod) {
        this.dialog
            .open(WorkshopModInterventionModalComponent, {
                data: {
                    availablePbos: mod.pbos
                }
            })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (selectedPbos: string[]) => {
                    if (selectedPbos) {
                        this.workshopService.resolveIntervention(mod.steamId, selectedPbos).pipe(first()).subscribe({
                            next: () => {},
                            error: (error: UksfError) => {
                                this.dialog.open(MessageModalComponent, {
                                    data: { message: error.error }
                                });
                            }
                        });
                    }
                }
            });
    }

    update(mod: WorkshopMod) {
        this.workshopService.updateMod(mod.steamId).pipe(first()).subscribe({
            next: () => {}
        });
    }

    uninstall(mod: WorkshopMod) {
        this.workshopService.uninstallMod(mod.steamId).pipe(first()).subscribe({
            next: () => {}
        });
    }

    delete(mod: WorkshopMod) {
        this.workshopService.deleteMod(mod.steamId).pipe(first()).subscribe({
            next: () => {}
        });
    }

    showError(mod: WorkshopMod) {
        this.dialog.open(MessageModalComponent, {
            data: { message: mod.errorMessage }
        });
    }

    trackBySteamId(_: number, mod: WorkshopMod) {
        return mod.steamId;
    }

    private isValidDate(date: string) {
        return date !== '0001-01-01T00:00:00.0000000Z';
    }
}
