import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { WorkshopModInterventionModalComponent } from './workshop-mod-intervention-modal.component';

describe('WorkshopModInterventionModalComponent', () => {
    let mockDialogRef: { close: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        mockDialogRef = { close: vi.fn() };
    });

    function createComponent(installedPbos: string[] | null, availablePbos: string[]): WorkshopModInterventionModalComponent {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                WorkshopModInterventionModalComponent,
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { installedPbos, availablePbos } }
            ]
        });
        return TestBed.inject(WorkshopModInterventionModalComponent);
    }

    it('preselects PBOs already installed', () => {
        const component = createComponent(['a.pbo', 'b.pbo', 'c.pbo'], ['b.pbo', 'c.pbo', 'd.pbo']);

        const b = component.pboSelection.find((p) => p.name === 'b.pbo');
        const c = component.pboSelection.find((p) => p.name === 'c.pbo');
        expect(b?.selected).toBe(true);
        expect(b?.state).toBe('existing');
        expect(c?.selected).toBe(true);
        expect(c?.state).toBe('existing');
    });

    it('marks newly available PBOs as new and unselected', () => {
        const component = createComponent(['a.pbo'], ['a.pbo', 'd.pbo']);

        const d = component.pboSelection.find((p) => p.name === 'd.pbo');
        expect(d?.selected).toBe(false);
        expect(d?.state).toBe('new');
    });

    it('marks removed PBOs as removed and disabled', () => {
        const component = createComponent(['a.pbo', 'b.pbo'], ['b.pbo']);

        const a = component.pboSelection.find((p) => p.name === 'a.pbo');
        expect(a?.state).toBe('removed');
        expect(a?.disabled).toBe(true);
        expect(a?.selected).toBe(false);
    });

    it('submits only the selected PBO names', () => {
        const component = createComponent(['a.pbo'], ['a.pbo', 'b.pbo']);

        component.submit();

        expect(mockDialogRef.close).toHaveBeenCalledWith(['a.pbo']);
    });

    it('selectAll toggles all non-disabled rows on', () => {
        const component = createComponent(['a.pbo', 'old.pbo'], ['a.pbo', 'b.pbo']);

        component.selectAll();

        const a = component.pboSelection.find((p) => p.name === 'a.pbo');
        const b = component.pboSelection.find((p) => p.name === 'b.pbo');
        const old = component.pboSelection.find((p) => p.name === 'old.pbo');
        expect(a?.selected).toBe(true);
        expect(b?.selected).toBe(true);
        expect(old?.selected).toBe(false);
    });

    it('handles null installedPbos (first install case)', () => {
        const component = createComponent(null, ['a.pbo', 'b.pbo']);

        expect(component.pboSelection).toHaveLength(2);
        expect(component.pboSelection.every((p) => p.state === 'new')).toBe(true);
        expect(component.pboSelection.every((p) => !p.selected)).toBe(true);
    });
});
