import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OperationsServersComponent } from './operations-servers.component';
import { setupOperationsServersSpec, teardownOperationsServersSpec } from './operations-servers.spec-setup';

describe('OperationsServersComponent mission upload', () => {
    let component: OperationsServersComponent;
    let mockGameServersService: any;
    let mockDialog: any;

    beforeEach(() => {
        ({ component, mockGameServersService, mockDialog } = setupOperationsServersSpec());
    });

    afterEach(() => {
        teardownOperationsServersSpec();
    });

    describe('resetDropZone', () => {
        it('resets file dragging state', () => {
            component.fileDragging = true;
            component.dropZoneHeight = 500;
            component.dropZoneWidth = 800;

            component.resetDropZone();

            expect(component.fileDragging).toBe(false);
            expect(component.dropZoneHeight).toBe(0);
            expect(component.dropZoneWidth).toBe(0);
        });
    });

    describe('fileDropFinished', () => {
        it('does nothing when both arrays are empty', () => {
            component.fileDropFinished([], []);

            expect(mockDialog.open).not.toHaveBeenCalled();
        });

        it('shows error when no pbo files found', () => {
            component.fileDropFinished([], [{ name: 'test.txt' }]);

            expect(mockDialog.open).toHaveBeenCalledWith(expect.any(Function), {
                data: { message: 'None of those files are PBOs files' }
            });
        });
    });

    describe('upload', () => {
        it('does nothing when files array is empty', () => {
            component.upload([]);

            expect(mockGameServersService.uploadMission).not.toHaveBeenCalled();
        });
    });
});
