import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';

import { OperationsMissionsComponent } from './operations-missions.component';
import { Mission } from '../../models/game-server';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { setupMissionsComponent, makeMission } from './operations-missions.testing';

describe('OperationsMissionsComponent', () => {
    let component: OperationsMissionsComponent;
    let mockMissionsService: ReturnType<typeof setupMissionsComponent>['mockMissionsService'];
    let mockServersHub: ReturnType<typeof setupMissionsComponent>['mockServersHub'];
    let mockDialog: ReturnType<typeof setupMissionsComponent>['mockDialog'];
    let reconnected$: ReturnType<typeof setupMissionsComponent>['reconnected$'];

    beforeEach(() => {
        ({ component, mockMissionsService, mockServersHub, mockDialog, reconnected$ } = setupMissionsComponent());
    });

    it('creates the component', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('connects to SignalR hub and loads missions', () => {
            component.ngOnInit();

            expect(mockServersHub.connect).toHaveBeenCalled();
            expect(mockServersHub.on).toHaveBeenCalledWith('ReceiveMissionsUpdate', expect.any(Function));
            expect(mockMissionsService.getActiveMissions).toHaveBeenCalled();
            expect(mockMissionsService.getArchivedMissions).toHaveBeenCalled();
        });

        it('reloads missions on hub reconnect', () => {
            component.ngOnInit();
            mockMissionsService.getActiveMissions.mockClear();
            mockMissionsService.getArchivedMissions.mockClear();

            reconnected$.next();

            expect(mockMissionsService.getActiveMissions).toHaveBeenCalled();
            expect(mockMissionsService.getArchivedMissions).toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('disconnects from SignalR hub', () => {
            component.ngOnInit();
            component.ngOnDestroy();

            expect(mockServersHub.off).toHaveBeenCalledWith('ReceiveMissionsUpdate', expect.any(Function));
            expect(mockServersHub.disconnect).toHaveBeenCalled();
        });
    });

    describe('loadMissions', () => {
        it('populates active and archived missions sorted by date desc by default', () => {
            const active: Mission[] = [
                makeMission({ name: 'older_mission', map: 'Stratis', lastModified: '2026-01-10T00:00:00Z' }),
                makeMission({ name: 'newer_mission', map: 'Altis', lastModified: '2026-01-15T00:00:00Z' })
            ];
            const archived: Mission[] = [
                makeMission({ name: 'old_mission', map: 'Tanoa' })
            ];
            mockMissionsService.getActiveMissions.mockReturnValue(of(active));
            mockMissionsService.getArchivedMissions.mockReturnValue(of(archived));

            component.loadMissions();

            expect(component.activeMissions).toHaveLength(2);
            expect(component.activeMissions[0].name).toBe('newer_mission');
            expect(component.activeMissions[1].name).toBe('older_mission');
            expect(component.archivedMissions).toHaveLength(1);
        });

        it('computes groups when missions are loaded', () => {
            const active: Mission[] = [
                makeMission({ name: 'mission1', map: 'Stratis' }),
                makeMission({ name: 'mission2', map: 'Altis' }),
                makeMission({ name: 'mission3', map: 'Stratis' })
            ];
            mockMissionsService.getActiveMissions.mockReturnValue(of(active));

            component.loadMissions();

            expect(component.activeGroups).toHaveLength(2);
            expect(component.activeGroups[0].map).toBe('Altis');
            expect(component.activeGroups[1].map).toBe('Stratis');
            expect(component.activeGroups[1].missions).toHaveLength(2);
        });
    });

    describe('sort', () => {
        beforeEach(() => {
            component.activeMissions = [
                makeMission({ name: 'b_mission', map: 'Stratis', lastModified: '2026-01-10T00:00:00Z' }),
                makeMission({ name: 'a_mission', map: 'Altis', lastModified: '2026-01-15T00:00:00Z' })
            ];
            component.archivedMissions = [];
        });

        it('sorts by name ascending', () => {
            component.sort('name', 'asc');

            expect(component.sortField).toBe('name');
            expect(component.sortDirection).toBe('asc');
            expect(component.activeMissions[0].name).toBe('a_mission');
            expect(component.activeMissions[1].name).toBe('b_mission');
        });

        it('sorts by name descending', () => {
            component.sort('name', 'desc');

            expect(component.sortDirection).toBe('desc');
            expect(component.activeMissions[0].name).toBe('b_mission');
        });

        it('sorts by date ascending', () => {
            component.sort('date', 'asc');

            expect(component.activeMissions[0].lastModified).toBe('2026-01-10T00:00:00Z');
            expect(component.activeMissions[1].lastModified).toBe('2026-01-15T00:00:00Z');
        });

        it('sorts by map then name ascending', () => {
            component.activeMissions = [
                makeMission({ name: 'z_mission', map: 'Altis' }),
                makeMission({ name: 'a_mission', map: 'Altis' }),
                makeMission({ name: 'c_mission', map: 'Stratis' })
            ];

            component.sort('map', 'asc');

            expect(component.sortDirection).toBe('asc');
            expect(component.activeMissions[0].name).toBe('a_mission');
            expect(component.activeMissions[1].name).toBe('z_mission');
            expect(component.activeMissions[2].name).toBe('c_mission');
        });

        it('recomputes groups after sorting', () => {
            component.activeMissions = [
                makeMission({ name: 'mission1', map: 'Stratis' }),
                makeMission({ name: 'mission2', map: 'Altis' })
            ];

            component.sort('name', 'asc');

            expect(component.activeGroups).toHaveLength(2);
        });
    });

    describe('toggleGroupByMap', () => {
        it('toggles groupByMap state', () => {
            expect(component.groupByMap).toBe(false);

            component.toggleGroupByMap();
            expect(component.groupByMap).toBe(true);

            component.toggleGroupByMap();
            expect(component.groupByMap).toBe(false);
        });
    });

    describe('download', () => {
        it('creates blob URL and triggers download using mission.path', () => {
            const mission = makeMission({ name: 'test_mission', path: 'test_mission.Altis.pbo' });
            const mockBlob = new Blob(['data']);
            mockMissionsService.downloadMission.mockReturnValue(of(mockBlob));

            const createObjectURL = vi.fn().mockReturnValue('blob:test');
            const revokeObjectURL = vi.fn();
            const originalCreate = URL.createObjectURL;
            const originalRevoke = URL.revokeObjectURL;
            URL.createObjectURL = createObjectURL;
            URL.revokeObjectURL = revokeObjectURL;

            const mockAnchor = { href: '', download: '', click: vi.fn() };
            const originalDocument = (globalThis as any).document;
            (globalThis as any).document = { createElement: vi.fn().mockReturnValue(mockAnchor) };

            component.download(mission);

            expect(mockMissionsService.downloadMission).toHaveBeenCalledWith('test_mission.Altis.pbo');
            expect(createObjectURL).toHaveBeenCalledWith(mockBlob);
            expect(mockAnchor.download).toBe('test_mission.Altis.pbo');
            expect(mockAnchor.click).toHaveBeenCalled();
            expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');

            URL.createObjectURL = originalCreate;
            URL.revokeObjectURL = originalRevoke;
            if (originalDocument === undefined) {
                delete (globalThis as any).document;
            } else {
                (globalThis as any).document = originalDocument;
            }
        });
    });

    describe('archive', () => {
        it('calls archiveMission with mission.path and reloads', () => {
            const mission = makeMission({ path: 'test_mission.Altis.pbo' });

            component.archive(mission);

            expect(mockMissionsService.archiveMission).toHaveBeenCalledWith('test_mission.Altis.pbo', 'conn-123');
            expect(mockMissionsService.getActiveMissions).toHaveBeenCalled();
        });
    });

    describe('restore', () => {
        it('calls restoreMission with mission.path and reloads', () => {
            const mission = makeMission({ path: 'test_mission.Altis.pbo' });

            component.restore(mission);

            expect(mockMissionsService.restoreMission).toHaveBeenCalledWith('test_mission.Altis.pbo', 'conn-123');
            expect(mockMissionsService.getActiveMissions).toHaveBeenCalled();
        });
    });

    describe('deleteMission', () => {
        it('opens confirmation dialog and deletes using mission.path on confirm', () => {
            const mission = makeMission({ name: 'test_mission', path: 'test_mission.Altis.pbo' });
            mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });

            component.deleteMission(mission);

            expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationModalComponent, {
                data: { message: "Are you sure you want to delete 'test_mission'?" }
            });
            expect(mockMissionsService.deleteMission).toHaveBeenCalledWith('test_mission.Altis.pbo', 'conn-123');
        });

        it('does not delete when dialog is cancelled', () => {
            const mission = makeMission({ name: 'test_mission' });
            mockDialog.open.mockReturnValue({ afterClosed: () => of(false) });

            component.deleteMission(mission);

            expect(mockDialog.open).toHaveBeenCalled();
            expect(mockMissionsService.deleteMission).not.toHaveBeenCalled();
        });
    });

});
