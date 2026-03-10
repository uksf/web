import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { first, takeUntil } from 'rxjs/operators';
import { ModpackHubService } from '../services/modpack-hub.service';
import { InstallWorkshopModData, WorkshopMod } from '../models/workshop-mod';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { UksfError } from '@app/shared/models/response';
import { MatDialog } from '@angular/material/dialog';
import { InstallWorkshopModModalComponent } from '../install-workshop-mod-modal/install-workshop-mod-modal.component';
import { WorkshopModInterventionModalComponent } from '../workshop-mod-intervention-modal/workshop-mod-intervention-modal.component';
import { WorkshopService } from '../services/workshop.service';
import { DestroyableComponent } from '@app/shared/components';
import { DefaultContentAreasComponent } from '../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '../../../shared/components/content-areas/full-content-area/full-content-area.component';
import { ModpackPageComponent } from '../modpack-page/modpack-page.component';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { FlexFillerComponent } from '../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-modpack-workshop',
    templateUrl: './modpack-workshop.component.html',
    styleUrls: ['../modpack-page/modpack-page.component.scss', './modpack-workshop.component.scss', './modpack-workshop.component.scss-theme.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, ModpackPageComponent, NgxPermissionsModule, MatButton, MatCard, FlexFillerComponent, MatTooltip, MatIcon]
})
export class ModpackWorkshopComponent extends DestroyableComponent implements OnInit, OnDestroy {
    private workshopService = inject(WorkshopService);
    private modpackHub = inject(ModpackHubService);
    private dialog = inject(MatDialog);

    private onReceiveWorkshopModAdded = () => this.getData();
    private onReceiveWorkshopModUpdate = (id: string) => this.getDataForMod(id);
    mods: WorkshopMod[] = [];

    ngOnInit() {
        this.getData(() => {
            this.mods.forEach((mod: WorkshopMod) => {
                this.getModUpdatedDate(mod);
            });
        });
        this.modpackHub.connect();
        this.modpackHub.on('ReceiveWorkshopModAdded', this.onReceiveWorkshopModAdded);
        this.modpackHub.on('ReceiveWorkshopModUpdate', this.onReceiveWorkshopModUpdate);
        this.modpackHub.reconnected$.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getData();
            }
        });
    }

    override ngOnDestroy() {
        super.ngOnDestroy();
        this.modpackHub.off('ReceiveWorkshopModAdded', this.onReceiveWorkshopModAdded);
        this.modpackHub.off('ReceiveWorkshopModUpdate', this.onReceiveWorkshopModUpdate);
        this.modpackHub.disconnect();
    }

    getData(callback: () => void = null) {
        this.workshopService
            .getMods()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (mods: WorkshopMod[]) => {
                    this.mods = mods;
                    this.updateModComputedProperties();
                    if (callback) {
                        callback();
                    }
                }
            });
    }

    getDataForMod(id: string) {
        this.workshopService
            .getMod(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (mod: WorkshopMod) => {
                    const index: number = this.mods.findIndex((x: WorkshopMod) => x.id === mod.id);
                    if (index === -1) {
                        this.getData();
                    } else {
                        this.mods.splice(index, 1, mod);
                        this.updateModComputedProperties();
                    }
                }
            });
    }

    getModUpdatedDate(mod: WorkshopMod) {
        this.workshopService
            .getModUpdatedDate(mod.steamId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (updatedDateResponse) => {
                    mod.updatedDate = updatedDateResponse.updatedDate;
                    mod._updateAvailable = this.updateAvailable(mod);
                }
            });
    }

    updateModComputedProperties() {
        this.mods.forEach((mod) => {
            mod._hasError = this.hasError(mod);
            mod._canUninstall = this.canUninstall(mod);
            mod._canDelete = this.canDelete(mod);
            mod._updateAvailable = this.updateAvailable(mod);
            mod._interventionRequired = this.interventionRequired(mod);
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
        this.dialog
            .open(InstallWorkshopModModalComponent)
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (data: InstallWorkshopModData) => {
                    if (data) {
                        this.workshopService
                            .installMod(data)
                            .pipe(first())
                            .subscribe({
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
                        this.workshopService
                            .resolveIntervention(mod.steamId, selectedPbos)
                            .pipe(first())
                            .subscribe({
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
        this.workshopService
            .updateMod(mod.steamId)
            .pipe(first())
            .subscribe({
                next: () => {}
            });
    }

    uninstall(mod: WorkshopMod) {
        this.workshopService
            .uninstallMod(mod.steamId)
            .pipe(first())
            .subscribe({
                next: () => {}
            });
    }

    delete(mod: WorkshopMod) {
        this.workshopService
            .deleteMod(mod.steamId)
            .pipe(first())
            .subscribe({
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
