import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ModpackWorkshopComponent } from './modpack-workshop.component';
import { of, Subject, throwError } from 'rxjs';
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
        availablePbos: [],
        ...overrides
    });

    beforeEach(() => {
        mockWorkshopService = {
            getMods: vi.fn().mockReturnValue(of([])),
            getMod: vi.fn().mockReturnValue(of(makeMod())),
            getModUpdatedDates: vi.fn().mockReturnValue(of([{ steamId: '12345', updatedDate: '2026-01-15T00:00:00Z' }])),
            installMod: vi.fn().mockReturnValue(of(undefined)),
            resolveIntervention: vi.fn().mockReturnValue(of(undefined)),
            updateMod: vi.fn().mockReturnValue(of(undefined)),
            retryMod: vi.fn().mockReturnValue(of(undefined)),
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
                { provide: MatDialog, useValue: mockDialog }
            ]
        });
        component = TestBed.inject(ModpackWorkshopComponent);
    });

    describe('trackBySteamId', () => {
        it('returns steamId', () => {
            expect(component.trackBySteamId(0, makeMod({ steamId: '99999' }))).toBe('99999');
        });
    });

    describe('getData', () => {
        it('fetches mods from service', () => {
            mockWorkshopService.getMods.mockReturnValue(of([makeMod({ id: '1' }), makeMod({ id: '2', steamId: '2' })]));

            component.getData();

            expect(mockWorkshopService.getMods).toHaveBeenCalled();
            expect(component.mods).toHaveLength(2);
        });

        it('calls callback after loading', () => {
            mockWorkshopService.getMods.mockReturnValue(of([makeMod()]));
            const callback = vi.fn();

            component.getData(callback);

            expect(callback).toHaveBeenCalled();
        });

        it('fetches updated dates for mods with no known date', () => {
            mockWorkshopService.getMods.mockReturnValue(of([makeMod()]));

            component.getData();

            expect(mockWorkshopService.getModUpdatedDates).toHaveBeenCalled();
            expect(component.mods[0].updatedDate).toBe('2026-01-15T00:00:00Z');
        });

        it('keeps known updated dates so mods stay in the updates section on refresh', () => {
            mockWorkshopService.getMods.mockReturnValue(of([makeMod()]));
            component.getData();
            mockWorkshopService.getModUpdatedDates.mockClear();

            component.getData();

            expect(mockWorkshopService.getModUpdatedDates).not.toHaveBeenCalled();
            expect(component.mods[0].updatedDate).toBe('2026-01-15T00:00:00Z');
            expect(component.sections.find((section) => section.key === 'updatesAvailable').mods).toHaveLength(1);
        });
    });

    describe('refreshUpdatedDates', () => {
        it('applies dates by steam id and regroups mods', () => {
            component.mods = [makeMod({ steamId: '12345' }), makeMod({ id: 'mod2', steamId: '54321' })];

            component.refreshUpdatedDates();

            expect(component.mods[0].updatedDate).toBe('2026-01-15T00:00:00Z');
            expect(component.mods[1].updatedDate).toBeUndefined();
            expect(component.sections.find((section) => section.key === 'updatesAvailable').mods).toHaveLength(1);
        });
    });

    describe('getDataForMod', () => {
        it('replaces existing mod in list and keeps its known updated date', () => {
            component.mods = [makeMod({ id: 'mod1', name: 'Old Name', updatedDate: '2026-02-01T00:00:00Z' })];
            mockWorkshopService.getMod.mockReturnValue(of(makeMod({ id: 'mod1', name: 'New Name' })));

            component.getDataForMod('mod1');

            expect(component.mods[0].name).toBe('New Name');
            expect(component.mods[0].updatedDate).toBe('2026-02-01T00:00:00Z');
            expect(component.sections.find((section) => section.key === 'updatesAvailable').mods).toHaveLength(1);
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
            component.update(makeMod({ steamId: '12345' }));

            expect(mockWorkshopService.updateMod).toHaveBeenCalledWith('12345');
        });
    });

    describe('retry', () => {
        it('calls service retryMod with steamId', () => {
            component.retry(makeMod({ steamId: '12345', status: 'Error' }));

            expect(mockWorkshopService.retryMod).toHaveBeenCalledWith('12345');
        });

        it('opens message dialog on error', () => {
            mockWorkshopService.retryMod.mockReturnValue(throwError(() => ({ error: 'Retry failed' })));

            component.retry(makeMod({ steamId: '12345', status: 'Error' }));

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), { data: { message: 'Retry failed' } });
        });
    });

    describe('uninstall', () => {
        it('calls service uninstallMod with steamId', () => {
            component.uninstall(makeMod({ steamId: '12345' }));

            expect(mockWorkshopService.uninstallMod).toHaveBeenCalledWith('12345');
        });
    });

    describe('delete', () => {
        it('calls service deleteMod with steamId', () => {
            component.delete(makeMod({ steamId: '12345' }));

            expect(mockWorkshopService.deleteMod).toHaveBeenCalledWith('12345');
        });
    });

    describe('install', () => {
        it('opens dialog and installs mod on close', () => {
            const dialogClose$ = new Subject<any>();
            mockDialog.open.mockReturnValue({ afterClosed: () => dialogClose$.asObservable() });

            component.install();
            dialogClose$.next({ steamId: '99999', rootMod: true, folderName: '@test' });

            expect(mockWorkshopService.installMod).toHaveBeenCalledWith({ steamId: '99999', rootMod: true, folderName: '@test' });
        });

        it('does nothing when dialog cancelled', () => {
            const dialogClose$ = new Subject<any>();
            mockDialog.open.mockReturnValue({ afterClosed: () => dialogClose$.asObservable() });

            component.install();
            dialogClose$.next(undefined);

            expect(mockWorkshopService.installMod).not.toHaveBeenCalled();
        });
    });

    describe('resolveIntervention', () => {
        it('sends the selected files for the mod', () => {
            const dialogClose$ = new Subject<any>();
            mockDialog.open.mockReturnValue({ afterClosed: () => dialogClose$.asObservable() });

            component.resolveIntervention(makeMod({ steamId: '12345', availablePbos: ['mod.pbo'] }));
            dialogClose$.next(['mod.pbo']);

            expect(mockWorkshopService.resolveIntervention).toHaveBeenCalledWith('12345', ['mod.pbo']);
        });
    });

    describe('ngOnInit', () => {
        it('connects to modpack hub and registers event handlers', () => {
            component.ngOnInit();

            expect(mockModpackHub.connect).toHaveBeenCalled();
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

    describe('showError', () => {
        it('opens message dialog with error message', () => {
            component.showError(makeMod({ errorMessage: 'Something failed' }));

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), { data: { message: 'Something failed' } });
        });
    });

    describe('responsive breakpoints', () => {
        it('hides inline actions below 600px', () => {
            component.viewportWidth = 500;
            component.updateResponsiveState();

            expect(component.showInlineActions).toBe(false);
        });

        it('shows inline actions at 600px and above', () => {
            component.viewportWidth = 600;
            component.updateResponsiveState();

            expect(component.showInlineActions).toBe(true);
        });
    });
});
