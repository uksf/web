import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModpackWorkshopComponent } from './modpack-workshop.component';
import { of, Subject } from 'rxjs';
import { WorkshopMod, WorkshopModStatus } from '../models/workshop-mod';

describe('ModpackWorkshopComponent', () => {
    let component: ModpackWorkshopComponent;
    let mockWorkshopService: any;
    let mockSignalrService: any;
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
        mockSignalrService = {
            connect: vi.fn().mockReturnValue({
                connection: { on: vi.fn(), off: vi.fn(), stop: vi.fn() },
                reconnectEvent: of()
            })
        };
        mockDialog = { open: vi.fn() };

        component = new ModpackWorkshopComponent(mockWorkshopService, mockSignalrService, mockDialog);
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
        it('connects to modpack SignalR hub', () => {
            component.ngOnInit();

            expect(mockSignalrService.connect).toHaveBeenCalledWith('modpack');
        });

        it('registers SignalR event handlers', () => {
            component.ngOnInit();

            const hubConnection = mockSignalrService.connect.mock.results[0].value;
            expect(hubConnection.connection.on).toHaveBeenCalledWith('ReceiveWorkshopModAdded', expect.any(Function));
            expect(hubConnection.connection.on).toHaveBeenCalledWith('ReceiveWorkshopModUpdate', expect.any(Function));
        });
    });

    describe('ngOnDestroy', () => {
        it('disconnects SignalR hub', () => {
            component.ngOnInit();
            const hubConnection = mockSignalrService.connect.mock.results[0].value;

            component.ngOnDestroy();

            expect(hubConnection.connection.off).toHaveBeenCalledWith('ReceiveWorkshopModAdded', expect.any(Function));
            expect(hubConnection.connection.off).toHaveBeenCalledWith('ReceiveWorkshopModUpdate', expect.any(Function));
            expect(hubConnection.connection.stop).toHaveBeenCalled();
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
});
