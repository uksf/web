import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { interval } from 'rxjs';
import { debounceTime, first, takeUntil } from 'rxjs/operators';
import { ModpackHubService } from '../services/modpack-hub.service';
import { InstallWorkshopModData, WorkshopMod, WorkshopModSection, WorkshopModUpdatedDate } from '../models/workshop-mod';
import { applyComputedProperties, groupModsIntoSections } from '../models/workshop-mod-grouping';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { UksfError } from '@app/shared/models/response';
import { MatDialog } from '@angular/material/dialog';
import { InstallWorkshopModModalComponent } from '../install-workshop-mod-modal/install-workshop-mod-modal.component';
import { WorkshopModInterventionModalComponent } from '../workshop-mod-intervention-modal/workshop-mod-intervention-modal.component';
import { WorkshopService } from '../services/workshop.service';
import { DestroyableComponent } from '@app/shared/components';
import { DefaultContentAreasComponent } from '../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '../../../shared/components/content-areas/full-content-area/full-content-area.component';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MatButton } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TextInputBoxedComponent } from '../../../shared/components/elements/text-input-boxed/text-input-boxed.component';
import { MatIcon } from '@angular/material/icon';
import { MatCard } from '@angular/material/card';

const UPDATED_DATE_POLL_INTERVAL_MS = 300000;

@Component({
    selector: 'app-modpack-workshop',
    templateUrl: './modpack-workshop.component.html',
    styleUrls: ['../modpack-page/modpack-page.component.scss', './modpack-workshop.component.scss'],
    imports: [DefaultContentAreasComponent, FullContentAreaComponent, NgxPermissionsModule, MatButton, MatCard, MatDivider, MatMenu, MatMenuItem, MatMenuTrigger, MatTooltip, MatIcon, ReactiveFormsModule, TextInputBoxedComponent]
})
export class ModpackWorkshopComponent extends DestroyableComponent implements OnInit, OnDestroy {
    private workshopService = inject(WorkshopService);
    private modpackHub = inject(ModpackHubService);
    private dialog = inject(MatDialog);

    private onReceiveWorkshopModAdded = () => this.getData();
    private onReceiveWorkshopModUpdate = (id: string) => this.getDataForMod(id);
    mods: WorkshopMod[] = [];
    sections: WorkshopModSection[] = [];
    searchControl = new FormControl('');
    private searchTerm = '';
    viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    showInlineActions = true;

    ngOnInit() {
        this.getData();
        interval(UPDATED_DATE_POLL_INTERVAL_MS)
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: () => this.refreshUpdatedDates() });
        this.modpackHub.connect();
        this.modpackHub.on('ReceiveWorkshopModAdded', this.onReceiveWorkshopModAdded);
        this.modpackHub.on('ReceiveWorkshopModUpdate', this.onReceiveWorkshopModUpdate);
        this.modpackHub.reconnected$.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getData();
            }
        });
        this.searchControl.valueChanges
            .pipe(debounceTime(150), takeUntil(this.destroy$))
            .subscribe({ next: (term) => this.applySearch(term ?? '') });
        this.updateResponsiveState();
    }

    @HostListener('window:resize')
    onResize() {
        this.viewportWidth = window.innerWidth;
        this.updateResponsiveState();
    }

    updateResponsiveState() {
        this.showInlineActions = this.viewportWidth >= 600;
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
                    this.mods = this.withKnownUpdatedDates(mods);
                    this.updateModComputedProperties();
                    if (this.mods.some((mod: WorkshopMod) => !mod.updatedDate)) {
                        this.refreshUpdatedDates();
                    }
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
                        mod.updatedDate = this.mods[index].updatedDate;
                        this.mods.splice(index, 1, mod);
                        this.updateModComputedProperties();
                    }
                }
            });
    }

    refreshUpdatedDates() {
        this.workshopService
            .getModUpdatedDates()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (updatedDates: WorkshopModUpdatedDate[]) => {
                    const datesBySteamId = new Map(updatedDates.map((x: WorkshopModUpdatedDate) => [x.steamId, x.updatedDate]));
                    this.mods.forEach((mod: WorkshopMod) => {
                        mod.updatedDate = datesBySteamId.get(mod.steamId) ?? mod.updatedDate;
                    });
                    this.updateModComputedProperties();
                }
            });
    }

    private withKnownUpdatedDates(mods: WorkshopMod[]): WorkshopMod[] {
        const knownDates = new Map(this.mods.map((mod: WorkshopMod) => [mod.steamId, mod.updatedDate]));
        mods.forEach((mod: WorkshopMod) => {
            mod.updatedDate = knownDates.get(mod.steamId);
        });
        return mods;
    }

    updateModComputedProperties() {
        this.mods.forEach(applyComputedProperties);
        this.groupMods();
    }

    applySearch(term: string) {
        this.searchTerm = term.toLowerCase();
        this.groupMods();
    }

    groupMods() {
        this.sections = groupModsIntoSections(this.mods, this.searchTerm);
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
                    installedPbos: mod.pbos,
                    availablePbos: mod.availablePbos
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

    retry(mod: WorkshopMod) {
        this.workshopService
            .retryMod(mod.steamId)
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
}
