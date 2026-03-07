import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';

import { OperationsMissionsComponent } from './operations-missions.component';
import { MissionsService } from '../../services/missions.service';
import { ServersHubService } from '../../services/servers-hub.service';
import { Mission, MissionReport } from '../../models/game-server';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { ValidationReportModalComponent } from '@app/shared/modals/validation-report-modal/validation-report-modal.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';

const makeMission = (overrides: Partial<Mission> = {}): Mission => ({
    name: 'co40_test',
    map: 'Altis',
    path: 'co40_test.Altis.pbo',
    size: 1024000,
    lastModified: '2026-01-15T12:00:00Z',
    ...overrides
});

describe('OperationsMissionsComponent', () => {
    let component: OperationsMissionsComponent;
    let mockMissionsService: Record<keyof MissionsService, ReturnType<typeof vi.fn>>;
    let mockServersHub: { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn>; off: ReturnType<typeof vi.fn>; connectionId: string; reconnected$: typeof reconnected$ };
    let mockDialog: { open: ReturnType<typeof vi.fn> };
    let reconnected$: Subject<void>;

    beforeEach(() => {
        reconnected$ = new Subject<void>();
        mockMissionsService = {
            getActiveMissions: vi.fn().mockReturnValue(of([])),
            getArchivedMissions: vi.fn().mockReturnValue(of([])),
            uploadMission: vi.fn().mockReturnValue(of({ missions: [], missionReports: [] })),
            downloadMission: vi.fn().mockReturnValue(of(new Blob(['test']))),
            deleteMission: vi.fn().mockReturnValue(of(undefined)),
            archiveMission: vi.fn().mockReturnValue(of(undefined)),
            restoreMission: vi.fn().mockReturnValue(of(undefined))
        };
        mockServersHub = {
            connect: vi.fn(),
            disconnect: vi.fn(),
            on: vi.fn(),
            off: vi.fn(),
            connectionId: 'conn-123',
            reconnected$: reconnected$.asObservable()
        };
        mockDialog = {
            open: vi.fn().mockReturnValue({ afterClosed: () => of(true) })
        };

        TestBed.configureTestingModule({
            providers: [
                OperationsMissionsComponent,
                { provide: MissionsService, useValue: mockMissionsService },
                { provide: ServersHubService, useValue: mockServersHub },
                { provide: MatDialog, useValue: mockDialog }
            ]
        });
        component = TestBed.inject(OperationsMissionsComponent);
    });

    it('creates the component', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('connects to SignalR hub and loads missions', () => {
            component.ngOnInit();

            expect(mockServersHub.connect).toHaveBeenCalled();
            expect(mockServersHub.on).toHaveBeenCalledWith('ReceiveMissionsUpdateIfNotCaller', expect.any(Function));
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

            expect(mockServersHub.off).toHaveBeenCalledWith('ReceiveMissionsUpdateIfNotCaller', expect.any(Function));
            expect(mockServersHub.disconnect).toHaveBeenCalled();
        });
    });

    describe('loadMissions', () => {
        it('populates active and archived missions sorted', () => {
            const active: Mission[] = [
                makeMission({ name: 'b_mission', map: 'Stratis' }),
                makeMission({ name: 'a_mission', map: 'Altis' })
            ];
            const archived: Mission[] = [
                makeMission({ name: 'old_mission', map: 'Tanoa' })
            ];
            mockMissionsService.getActiveMissions.mockReturnValue(of(active));
            mockMissionsService.getArchivedMissions.mockReturnValue(of(archived));

            component.loadMissions();

            expect(component.activeMissions).toHaveLength(2);
            expect(component.activeMissions[0].map).toBe('Altis');
            expect(component.activeMissions[1].map).toBe('Stratis');
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

    describe('setSort', () => {
        beforeEach(() => {
            component.activeMissions = [
                makeMission({ name: 'b_mission', map: 'Stratis', lastModified: '2026-01-10T00:00:00Z' }),
                makeMission({ name: 'a_mission', map: 'Altis', lastModified: '2026-01-15T00:00:00Z' })
            ];
            component.archivedMissions = [];
        });

        it('sorts by name ascending', () => {
            component.setSort('name');

            expect(component.sortField).toBe('name');
            expect(component.sortDirection).toBe('asc');
            expect(component.activeMissions[0].name).toBe('a_mission');
            expect(component.activeMissions[1].name).toBe('b_mission');
        });

        it('toggles direction when same field clicked again', () => {
            component.setSort('name');
            expect(component.sortDirection).toBe('asc');

            component.setSort('name');
            expect(component.sortDirection).toBe('desc');
            expect(component.activeMissions[0].name).toBe('b_mission');
        });

        it('resets direction to asc when changing field', () => {
            component.setSort('name');
            component.setSort('name'); // now desc
            component.setSort('date');

            expect(component.sortField).toBe('date');
            expect(component.sortDirection).toBe('asc');
        });

        it('sorts by date ascending', () => {
            component.setSort('date');

            expect(component.activeMissions[0].lastModified).toBe('2026-01-10T00:00:00Z');
            expect(component.activeMissions[1].lastModified).toBe('2026-01-15T00:00:00Z');
        });

        it('sorts by map then name ascending', () => {
            component.sortField = 'name';
            component.activeMissions = [
                makeMission({ name: 'z_mission', map: 'Altis' }),
                makeMission({ name: 'a_mission', map: 'Altis' }),
                makeMission({ name: 'c_mission', map: 'Stratis' })
            ];

            component.setSort('map');

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

            component.setSort('name');

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
            (globalThis as any).URL = { createObjectURL, revokeObjectURL };

            const mockAnchor = { href: '', download: '', click: vi.fn() };
            (globalThis as any).document = { createElement: vi.fn().mockReturnValue(mockAnchor) };

            component.download(mission);

            expect(mockMissionsService.downloadMission).toHaveBeenCalledWith('test_mission.Altis.pbo');
            expect(createObjectURL).toHaveBeenCalledWith(mockBlob);
            expect(mockAnchor.download).toBe('test_mission.Altis.pbo');
            expect(mockAnchor.click).toHaveBeenCalled();
            expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');

            delete (globalThis as any).URL;
            delete (globalThis as any).document;
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

    describe('onFileOver / onFileLeave', () => {
        it('sets fileDragging on file over', () => {
            component.onFileOver();
            expect(component.fileDragging).toBe(true);
        });

        it('clears fileDragging on file leave', () => {
            component.fileDragging = true;
            component.onFileLeave();
            expect(component.fileDragging).toBe(false);
        });
    });

    describe('onFileDrop', () => {
        it('clears fileDragging and uploads valid pbo files', () => {
            component.fileDragging = true;
            const mockFile = new File(['content'], 'test.pbo', { type: 'application/octet-stream' });
            const event = {
                files: [{
                    relativePath: 'test.pbo',
                    fileEntry: { file: (cb: (f: File) => void) => cb(mockFile) }
                }]
            };

            component.onFileDrop(event);

            expect(component.fileDragging).toBe(false);
            expect(mockMissionsService.uploadMission).toHaveBeenCalled();
        });

        it('shows error dialog for non-pbo files', () => {
            const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
            const event = {
                files: [{
                    relativePath: 'test.txt',
                    fileEntry: { file: (cb: (f: File) => void) => cb(mockFile) }
                }]
            };

            component.onFileDrop(event);

            expect(mockDialog.open).toHaveBeenCalledWith(MessageModalComponent, {
                data: { message: 'None of those files are PBO files' }
            });
            expect(mockMissionsService.uploadMission).not.toHaveBeenCalled();
        });

        it('shows confirmation for mixed pbo and non-pbo files', () => {
            const pboFile = new File(['content'], 'mission.pbo', { type: 'application/octet-stream' });
            const txtFile = new File(['content'], 'readme.txt', { type: 'text/plain' });
            mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });

            const event = {
                files: [
                    {
                        relativePath: 'readme.txt',
                        fileEntry: { file: (cb: (f: File) => void) => cb(txtFile) }
                    },
                    {
                        relativePath: 'mission.pbo',
                        fileEntry: { file: (cb: (f: File) => void) => cb(pboFile) }
                    }
                ]
            };

            component.onFileDrop(event);

            expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationModalComponent, {
                data: { message: expect.stringContaining('mission.pbo') }
            });
        });

        it('handles all async callbacks regardless of resolution order', () => {
            const pboFile = new File(['content'], 'mission.pbo');
            const callbacks: ((f: File) => void)[] = [];
            const event = {
                files: [
                    {
                        relativePath: 'first.pbo',
                        fileEntry: { file: (cb: (f: File) => void) => callbacks.push(cb) }
                    },
                    {
                        relativePath: 'second.pbo',
                        fileEntry: { file: (cb: (f: File) => void) => callbacks.push(cb) }
                    }
                ]
            };

            component.onFileDrop(event);

            // Resolve in reverse order
            callbacks[1](pboFile);
            expect(mockMissionsService.uploadMission).not.toHaveBeenCalled();
            callbacks[0](pboFile);
            expect(mockMissionsService.uploadMission).toHaveBeenCalled();
        });

        it('does nothing for empty file list', () => {
            component.onFileDrop({ files: [] });
            expect(mockMissionsService.uploadMission).not.toHaveBeenCalled();
            expect(mockDialog.open).not.toHaveBeenCalled();
        });
    });

    describe('uploadFromButton', () => {
        it('uploads files from input event', () => {
            const mockFile = new File(['content'], 'test.pbo', { type: 'application/octet-stream' });
            const mockFileList = [mockFile] as unknown as FileList;
            Object.defineProperty(mockFileList, 'length', { value: 1 });
            const event = {
                target: { files: mockFileList }
            } as unknown as Event;

            component.uploadFromButton(event);

            expect(mockMissionsService.uploadMission).toHaveBeenCalled();
        });

        it('does nothing when no files selected', () => {
            const event = {
                target: { files: null }
            } as unknown as Event;

            component.uploadFromButton(event);

            expect(mockMissionsService.uploadMission).not.toHaveBeenCalled();
        });
    });

    describe('upload response handling', () => {
        const makeFileEvent = () => {
            const mockFile = new File(['content'], 'test.pbo', { type: 'application/octet-stream' });
            const mockFileList = [mockFile] as unknown as FileList;
            Object.defineProperty(mockFileList, 'length', { value: 1 });
            return { target: { files: mockFileList } } as unknown as Event;
        };

        it('shows mission reports after successful upload', () => {
            const reports: MissionReport[] = [
                { mission: 'test.pbo', reports: [{ title: 'Warning: missing description.ext', detail: 'File not found', error: false }] }
            ];
            mockMissionsService.uploadMission.mockReturnValue(of({
                missions: [],
                missionReports: reports
            }));
            mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });

            component.uploadFromButton(makeFileEvent());

            expect(mockDialog.open).toHaveBeenCalledWith(ValidationReportModalComponent, {
                data: { title: 'Mission file: test.pbo', messages: [{ title: 'Warning: missing description.ext', detail: 'File not found', error: false }] }
            });
        });

        it('shows success message when upload has no reports', () => {
            const reports: MissionReport[] = [
                { mission: 'test.pbo', reports: [] }
            ];
            mockMissionsService.uploadMission.mockReturnValue(of({
                missions: [],
                missionReports: reports
            }));
            mockDialog.open.mockReturnValue({ afterClosed: () => of(true) });

            component.uploadFromButton(makeFileEvent());

            expect(mockDialog.open).toHaveBeenCalledWith(MessageModalComponent, {
                data: { message: "Successfully uploaded 'test.pbo'" }
            });
        });
    });

    describe('SignalR update handler', () => {
        it('uses missions data from SignalR and reloads archived', () => {
            component.ngOnInit();
            mockMissionsService.getActiveMissions.mockClear();
            mockMissionsService.getArchivedMissions.mockClear();

            const onCall = mockServersHub.on.mock.calls.find(
                (c: [string, ...unknown[]]) => c[0] === 'ReceiveMissionsUpdateIfNotCaller'
            );
            const callback = onCall[1];

            const missions = [makeMission({ name: 'updated', map: 'Tanoa' })];
            callback('different-conn', missions);

            // Active missions set directly from SignalR data
            expect(component.activeMissions).toHaveLength(1);
            expect(component.activeMissions[0].name).toBe('updated');
            // Archived missions refetched
            expect(mockMissionsService.getArchivedMissions).toHaveBeenCalled();
            // Active missions NOT refetched (used SignalR data)
            expect(mockMissionsService.getActiveMissions).not.toHaveBeenCalled();
        });

        it('does not update when signal is from same connection', () => {
            component.ngOnInit();
            mockMissionsService.getActiveMissions.mockClear();
            mockMissionsService.getArchivedMissions.mockClear();

            const onCall = mockServersHub.on.mock.calls.find(
                (c: [string, ...unknown[]]) => c[0] === 'ReceiveMissionsUpdateIfNotCaller'
            );
            const callback = onCall[1];

            callback('conn-123', []);

            expect(mockMissionsService.getActiveMissions).not.toHaveBeenCalled();
            expect(mockMissionsService.getArchivedMissions).not.toHaveBeenCalled();
        });
    });

    describe('trackBy functions', () => {
        it('trackByMissionPath returns mission path', () => {
            const mission = makeMission({ path: 'test.Altis.pbo' });
            expect(component.trackByMissionPath(0, mission)).toBe('test.Altis.pbo');
        });

        it('trackByMapGroup returns group map', () => {
            expect(component.trackByMapGroup(0, { map: 'Altis', missions: [] })).toBe('Altis');
        });
    });
});
