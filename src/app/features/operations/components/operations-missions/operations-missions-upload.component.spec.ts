import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { of } from 'rxjs';

import { OperationsMissionsComponent } from './operations-missions.component';
import { MissionReport } from '../../models/game-server';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { ValidationReportModalComponent } from '@app/shared/modals/validation-report-modal/validation-report-modal.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { setupMissionsComponent, makeMission } from './operations-missions.testing';

describe('OperationsMissionsComponent uploads', () => {
    let component: OperationsMissionsComponent;
    let mockMissionsService: ReturnType<typeof setupMissionsComponent>['mockMissionsService'];
    let mockServersHub: ReturnType<typeof setupMissionsComponent>['mockServersHub'];
    let mockDialog: ReturnType<typeof setupMissionsComponent>['mockDialog'];

    beforeEach(() => {
        ({ component, mockMissionsService, mockServersHub, mockDialog } = setupMissionsComponent());
    });

    describe('onFileOver / onFileLeave', () => {
        beforeEach(() => {
            (component as unknown as { missionsContainer: { nativeElement: HTMLElement } }).missionsContainer = {
                nativeElement: { getBoundingClientRect: () => ({ height: 500, width: 800, top: 0 }) as DOMRect } as unknown as HTMLElement
            };
            (globalThis as unknown as { window: { innerHeight: number } }).window = { innerHeight: 1000 };
        });

        afterEach(() => {
            delete (globalThis as unknown as { window?: unknown }).window;
        });

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
                (c: [string, ...unknown[]]) => c[0] === 'ReceiveMissionsUpdate'
            );
            const callback = onCall[1];

            const missions = [makeMission({ name: 'updated', map: 'Tanoa' })];
            callback(missions);

            expect(component.activeMissions).toHaveLength(1);
            expect(component.activeMissions[0].name).toBe('updated');
            expect(mockMissionsService.getArchivedMissions).toHaveBeenCalled();
            expect(mockMissionsService.getActiveMissions).not.toHaveBeenCalled();
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
