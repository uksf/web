import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ModpackWorkshopComponent } from './modpack-workshop.component';
import { of, Subject } from 'rxjs';
import { WorkshopMod, WorkshopModStatus } from '../models/workshop-mod';
import { WorkshopService } from '../services/workshop.service';
import { ModpackHubService } from '../services/modpack-hub.service';
import { MatDialog } from '@angular/material/dialog';

describe('ModpackWorkshopComponent', () => {
    let component: ModpackWorkshopComponent;
    let mockWorkshopService: any;
    let mockModpackHub: any;
    let mockDialog: any;

    const makeMod = (overrides: Partial<WorkshopMod> = {}): WorkshopMod => ({
        id: 'mod1',
        steamId: '12345',
        name: 'Test Mod',
        status: 'Installed' as WorkshopModStatus,
        statusMessage: '',
        errorMessage: '',
        lastUpdatedLocally: '2026-01-01T00:00:00Z',
        modpackVersionFirstAdded: '1.0',
        modpackVersionLastUpdated: '1.0',
        rootMod: true,
        folderName: '@testmod',
        pbos: [],
        ...overrides
    });

    beforeEach(() => {
        mockWorkshopService = {
            getMods: vi.fn().mockReturnValue(of([])),
            getMod: vi.fn().mockReturnValue(of(makeMod())),
            getModUpdatedDate: vi.fn().mockReturnValue(of({ updatedDate: '2026-01-15T00:00:00Z' })),
            installMod: vi.fn().mockReturnValue(of(undefined)),
            resolveIntervention: vi.fn().mockReturnValue(of(undefined)),
            updateMod: vi.fn().mockReturnValue(of(undefined)),
            uninstallMod: vi.fn().mockReturnValue(of(undefined)),
            deleteMod: vi.fn().mockReturnValue(of(undefined))
        };
        mockModpackHub = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
            reconnected$: new Subject<void>().asObservable()
        };
        mockDialog = { open: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                ModpackWorkshopComponent,
                { provide: WorkshopService, useValue: mockWorkshopService },
                { provide: ModpackHubService, useValue: mockModpackHub },
                { provide: MatDialog, useValue: mockDialog },
            ]
        });
        component = TestBed.inject(ModpackWorkshopComponent);
    });

    describe('interventionRequired', () => {
        it('returns true for InterventionRequired status', () => {
            expect(component.interventionRequired(makeMod({ status: 'InterventionRequired' }))).toBe(true);
        });

        it('returns false for other statuses', () => {
            expect(component.interventionRequired(makeMod({ status: 'Installed' }))).toBe(false);
        });
    });

    describe('updateAvailable', () => {
        it('returns true when remote is newer than local', () => {
            const mod = makeMod({
                updatedDate: '2026-02-01T00:00:00Z',
                lastUpdatedLocally: '2026-01-01T00:00:00Z'
            });

            expect(component.updateAvailable(mod)).toBe(true);
        });

        it('returns false when dates are equal', () => {
            const mod = makeMod({
                updatedDate: '2026-01-01T00:00:00Z',
                lastUpdatedLocally: '2026-01-01T00:00:00Z'
            });

            expect(component.updateAvailable(mod)).toBe(false);
        });

        it('returns false when updatedDate is null', () => {
            const mod = makeMod({ updatedDate: null });

            expect(component.updateAvailable(mod)).toBe(false);
        });

        it('returns false when date is zero value', () => {
            const mod = makeMod({
                updatedDate: '0001-01-01T00:00:00.0000000Z',
                lastUpdatedLocally: '2026-01-01T00:00:00Z'
            });

            expect(component.updateAvailable(mod)).toBe(false);
        });
    });

    describe('canUninstall', () => {
        it.each([
            'InstalledPendingRelease',
            'Installed',
            'UpdatedPendingRelease',
            'InterventionRequired',
            'Error'
        ] as WorkshopModStatus[])('returns true for %s', (status) => {
            expect(component.canUninstall(makeMod({ status }))).toBe(true);
        });

        it.each([
            'Uninstalled',
            'Installing',
            'Updating',
            'Uninstalling'
        ] as WorkshopModStatus[])('returns false for %s', (status) => {
            expect(component.canUninstall(makeMod({ status }))).toBe(false);
        });
    });

    describe('canDelete', () => {
        it('returns true for Uninstalled', () => {
            expect(component.canDelete(makeMod({ status: 'Uninstalled' }))).toBe(true);
        });

        it('returns false for Installed', () => {
            expect(component.canDelete(makeMod({ status: 'Installed' }))).toBe(false);
        });
    });

    describe('hasError', () => {
        it('returns true for Error status', () => {
            expect(component.hasError(makeMod({ status: 'Error' }))).toBe(true);
        });

        it('returns false for non-error status', () => {
            expect(component.hasError(makeMod({ status: 'Installed' }))).toBe(false);
        });
    });

    describe('trackBySteamId', () => {
        it('returns steamId', () => {
            expect(component.trackBySteamId(0, makeMod({ steamId: '99999' }))).toBe('99999');
        });
    });

    describe('getData', () => {
        it('fetches mods from service', () => {
            const mods = [makeMod({ id: '1' }), makeMod({ id: '2' })];
            mockWorkshopService.getMods.mockReturnValue(of(mods));

            component.getData();

            expect(mockWorkshopService.getMods).toHaveBeenCalled();
            expect(component.mods).toHaveLength(2);
        });

        it('calls callback after loading', () => {
            const mods = [makeMod()];
            mockWorkshopService.getMods.mockReturnValue(of(mods));
            const callback = vi.fn();

            component.getData(callback);

            expect(callback).toHaveBeenCalled();
        });
    });

    describe('getDataForMod', () => {
        it('replaces existing mod in list', () => {
            const existingMod = makeMod({ id: 'mod1', name: 'Old Name' });
            component.mods = [existingMod];
            const updatedMod = makeMod({ id: 'mod1', name: 'New Name' });
            mockWorkshopService.getMod.mockReturnValue(of(updatedMod));

            component.getDataForMod('mod1');

            expect(component.mods[0].name).toBe('New Name');
        });

        it('fetches all mods when mod not found in list', () => {
            component.mods = [];
            const newMod = makeMod({ id: 'new-mod' });
            mockWorkshopService.getMod.mockReturnValue(of(newMod));
            mockWorkshopService.getMods.mockReturnValue(of([newMod]));

            component.getDataForMod('new-mod');

            expect(mockWorkshopService.getMods).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('calls service updateMod with steamId', () => {
            const mod = makeMod({ steamId: '12345' });

            component.update(mod);

            expect(mockWorkshopService.updateMod).toHaveBeenCalledWith('12345');
        });
    });

    describe('uninstall', () => {
        it('calls service uninstallMod with steamId', () => {
            const mod = makeMod({ steamId: '12345' });

            component.uninstall(mod);

            expect(mockWorkshopService.uninstallMod).toHaveBeenCalledWith('12345');
        });
    });

    describe('delete', () => {
        it('calls service deleteMod with steamId', () => {
            const mod = makeMod({ steamId: '12345' });

            component.delete(mod);

            expect(mockWorkshopService.deleteMod).toHaveBeenCalledWith('12345');
        });
    });

    describe('install', () => {
        it('opens dialog and installs mod on close', () => {
            const dialogClose$ = new Subject<any>();
            mockDialog.open.mockReturnValue({ afterClosed: () => dialogClose$.asObservable() });

            component.install();
            dialogClose$.next({ steamId: '99999', rootMod: true, folderName: '@test' });

            expect(mockWorkshopService.installMod).toHaveBeenCalledWith({
                steamId: '99999',
                rootMod: true,
                folderName: '@test'
            });
        });

        it('does nothing when dialog cancelled', () => {
            const dialogClose$ = new Subject<any>();
            mockDialog.open.mockReturnValue({ afterClosed: () => dialogClose$.asObservable() });

            component.install();
            dialogClose$.next(undefined);

            expect(mockWorkshopService.installMod).not.toHaveBeenCalled();
        });
    });

    describe('ngOnInit', () => {
        it('connects to modpack hub', () => {
            component.ngOnInit();

            expect(mockModpackHub.connect).toHaveBeenCalled();
        });

        it('registers event handlers', () => {
            component.ngOnInit();

            expect(mockModpackHub.on).toHaveBeenCalledWith('ReceiveWorkshopModAdded', expect.any(Function));
            expect(mockModpackHub.on).toHaveBeenCalledWith('ReceiveWorkshopModUpdate', expect.any(Function));
        });
    });

    describe('ngOnDestroy', () => {
        it('disconnects hub', () => {
            component.ngOnInit();

            component.ngOnDestroy();

            expect(mockModpackHub.off).toHaveBeenCalledWith('ReceiveWorkshopModAdded', expect.any(Function));
            expect(mockModpackHub.off).toHaveBeenCalledWith('ReceiveWorkshopModUpdate', expect.any(Function));
            expect(mockModpackHub.disconnect).toHaveBeenCalled();
        });
    });

    describe('updateModComputedProperties', () => {
        it('should set computed properties on each mod', () => {
            component.mods = [
                makeMod({ status: 'Error', updatedDate: '2026-02-01T00:00:00Z', lastUpdatedLocally: '2026-01-01T00:00:00Z' }),
                makeMod({ status: 'Uninstalled' })
            ];

            component.updateModComputedProperties();

            expect(component.mods[0]._hasError).toBe(true);
            expect(component.mods[0]._canUninstall).toBe(true);
            expect(component.mods[0]._canDelete).toBe(false);
            expect(component.mods[0]._updateAvailable).toBe(true);
            expect(component.mods[0]._interventionRequired).toBe(false);

            expect(component.mods[1]._hasError).toBe(false);
            expect(component.mods[1]._canUninstall).toBe(false);
            expect(component.mods[1]._canDelete).toBe(true);
            expect(component.mods[1]._updateAvailable).toBe(false);
        });
    });

    describe('showError', () => {
        it('opens message dialog with error message', () => {
            const mod = makeMod({ errorMessage: 'Something failed' });

            component.showError(mod);

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                data: { message: 'Something failed' }
            });
        });
    });

    describe('search filtering', () => {
        it('filters sections by mod name (case-insensitive)', () => {
            component.mods = [
                makeMod({ id: '1', status: 'Installed', name: 'ACE' }),
                makeMod({ id: '2', status: 'Installed', name: 'CBA_A3' }),
                makeMod({ id: '3', status: 'Installed', name: 'ACE_Compat' }),
            ];
            component.updateModComputedProperties();

            component.applySearch('ace');

            const installed = component.sections.find(s => s.key === 'installed');
            expect(installed.mods.map(m => m.name)).toEqual(['ACE', 'ACE_Compat']);
        });

        it('shows all mods when search is empty', () => {
            component.mods = [
                makeMod({ id: '1', status: 'Installed', name: 'ACE' }),
                makeMod({ id: '2', status: 'Installed', name: 'CBA_A3' }),
            ];
            component.updateModComputedProperties();

            component.applySearch('');

            const installed = component.sections.find(s => s.key === 'installed');
            expect(installed.mods).toHaveLength(2);
        });

        it('filters across all sections', () => {
            component.mods = [
                makeMod({ id: '1', status: 'Error', name: 'ACE Error' }),
                makeMod({ id: '2', status: 'Installed', name: 'ACE Compat' }),
                makeMod({ id: '3', status: 'Installed', name: 'CBA_A3' }),
            ];
            component.updateModComputedProperties();

            component.applySearch('ace');

            const attention = component.sections.find(s => s.key === 'needsAttention');
            expect(attention.mods).toHaveLength(1);
            const installed = component.sections.find(s => s.key === 'installed');
            expect(installed.mods).toHaveLength(1);
        });
    });

    describe('responsive breakpoints', () => {
        it('hides steam ID below 1024px', () => {
            component.viewportWidth = 900;
            component.updateResponsiveState();

            expect(component.showSteamId).toBe(false);
        });

        it('shows steam ID at 1024px and above', () => {
            component.viewportWidth = 1024;
            component.updateResponsiveState();

            expect(component.showSteamId).toBe(true);
        });

        it('hides status text below 768px', () => {
            component.viewportWidth = 700;
            component.updateResponsiveState();

            expect(component.showStatusText).toBe(false);
        });

        it('hides inline actions below 600px', () => {
            component.viewportWidth = 500;
            component.updateResponsiveState();

            expect(component.showInlineActions).toBe(false);
        });

        it('shows all elements at wide viewport', () => {
            component.viewportWidth = 1400;
            component.updateResponsiveState();

            expect(component.showSteamId).toBe(true);
            expect(component.showStatusText).toBe(true);
            expect(component.showInlineActions).toBe(true);
        });
    });

    describe('groupMods', () => {
        it('places Error mods in needsAttention section', () => {
            component.mods = [makeMod({ status: 'Error', name: 'ErrorMod' })];
            component.updateModComputedProperties();

            component.groupMods();

            const section = component.sections.find(s => s.key === 'needsAttention');
            expect(section.mods).toHaveLength(1);
            expect(section.mods[0].name).toBe('ErrorMod');
        });

        it('places InterventionRequired mods in needsAttention section', () => {
            component.mods = [makeMod({ status: 'InterventionRequired', name: 'BrokenMod' })];
            component.updateModComputedProperties();

            component.groupMods();

            const section = component.sections.find(s => s.key === 'needsAttention');
            expect(section.mods).toHaveLength(1);
        });

        it('places Installing/Updating/Uninstalling mods in inProgress section', () => {
            component.mods = [
                makeMod({ id: '1', status: 'Installing', name: 'Mod A' }),
                makeMod({ id: '2', status: 'Updating', name: 'Mod B' }),
                makeMod({ id: '3', status: 'Uninstalling', name: 'Mod C' }),
            ];
            component.updateModComputedProperties();

            component.groupMods();

            const section = component.sections.find(s => s.key === 'inProgress');
            expect(section.mods).toHaveLength(3);
        });

        it('places mods with _updateAvailable in updatesAvailable section', () => {
            component.mods = [makeMod({
                status: 'Installed',
                name: 'UpdateMe',
                updatedDate: '2026-02-01T00:00:00Z',
                lastUpdatedLocally: '2026-01-01T00:00:00Z'
            })];
            component.updateModComputedProperties();

            component.groupMods();

            const section = component.sections.find(s => s.key === 'updatesAvailable');
            expect(section.mods).toHaveLength(1);
            const installed = component.sections.find(s => s.key === 'installed');
            expect(installed.mods).toHaveLength(0);
        });

        it('places PendingRelease mods in pendingRelease section', () => {
            component.mods = [
                makeMod({ id: '1', status: 'InstalledPendingRelease', name: 'Pending A' }),
                makeMod({ id: '2', status: 'UpdatedPendingRelease', name: 'Pending B' }),
                makeMod({ id: '3', status: 'UninstalledPendingRelease', name: 'Pending C' }),
            ];
            component.updateModComputedProperties();

            component.groupMods();

            const section = component.sections.find(s => s.key === 'pendingRelease');
            expect(section.mods).toHaveLength(3);
        });

        it('places Installed mods without updates in installed section', () => {
            component.mods = [makeMod({ status: 'Installed', name: 'StableMod' })];
            component.updateModComputedProperties();

            component.groupMods();

            const section = component.sections.find(s => s.key === 'installed');
            expect(section.mods).toHaveLength(1);
        });

        it('places Uninstalled mods in uninstalled section', () => {
            component.mods = [makeMod({ status: 'Uninstalled', name: 'OldMod' })];
            component.updateModComputedProperties();

            component.groupMods();

            const section = component.sections.find(s => s.key === 'uninstalled');
            expect(section.mods).toHaveLength(1);
        });

        it('sorts mods alphabetically within each section', () => {
            component.mods = [
                makeMod({ id: '1', status: 'Installed', name: 'Zebra' }),
                makeMod({ id: '2', status: 'Installed', name: 'Alpha' }),
                makeMod({ id: '3', status: 'Installed', name: 'Middle' }),
            ];
            component.updateModComputedProperties();

            component.groupMods();

            const section = component.sections.find(s => s.key === 'installed');
            expect(section.mods.map(m => m.name)).toEqual(['Alpha', 'Middle', 'Zebra']);
        });

        it('omits sections with zero mods', () => {
            component.mods = [makeMod({ status: 'Installed', name: 'OnlyInstalled' })];
            component.updateModComputedProperties();

            component.groupMods();

            const nonEmptySections = component.sections.filter(s => s.mods.length > 0);
            expect(nonEmptySections).toHaveLength(1);
            expect(nonEmptySections[0].key).toBe('installed');
        });

        it('assigns each mod to exactly one section based on priority', () => {
            component.mods = [makeMod({
                status: 'Error',
                name: 'ErrorWithUpdate',
                updatedDate: '2026-02-01T00:00:00Z',
                lastUpdatedLocally: '2026-01-01T00:00:00Z'
            })];
            component.updateModComputedProperties();

            component.groupMods();

            const allMods = component.sections.flatMap(s => s.mods);
            expect(allMods).toHaveLength(1);
            const section = component.sections.find(s => s.key === 'needsAttention');
            expect(section.mods).toHaveLength(1);
        });
    });
});
