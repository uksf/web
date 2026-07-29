import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { WorkshopModInterventionModalComponent } from './workshop-mod-intervention-modal.component';

describe('WorkshopModInterventionModalComponent', () => {
    let mockDialogRef: { close: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        mockDialogRef = { close: vi.fn() };
    });

    function createComponent(
        installedPbos: string[] | null,
        availablePbos: string[],
        installedExtensions: string[] | null = [],
        availableExtensions: string[] = []
    ): WorkshopModInterventionModalComponent {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                WorkshopModInterventionModalComponent,
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: { installedPbos, availablePbos, installedExtensions, availableExtensions } }
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

    it('starts on the PBO step and submits directly when the mod has no extensions', () => {
        const component = createComponent(['a.pbo'], ['a.pbo', 'b.pbo']);

        expect(component.onExtensionStep).toBe(false);
        expect(component.hasExtensionStep).toBe(false);
        expect(component.isLastStep).toBe(true);
        expect(component.title).toBe('Select PBOs to install');

        component.submit();

        expect(mockDialogRef.close).toHaveBeenCalledWith({ selectedPbos: ['a.pbo'], selectedExtensions: [] });
    });

    it('moves to the extension step when the mod root ships dlls', () => {
        const component = createComponent(['a.pbo'], ['a.pbo'], [], ['ctab_connect.dll']);

        expect(component.hasExtensionStep).toBe(true);
        expect(component.isLastStep).toBe(false);
        expect(component.rows.map((x) => x.name)).toEqual(['a.pbo']);

        component.next();

        expect(component.title).toBe('Select extensions to install');
        expect(component.rows.map((x) => x.name)).toEqual(['ctab_connect.dll']);
        expect(component.isLastStep).toBe(true);
    });

    it('skips straight to extensions when the mod has no pbos', () => {
        const component = createComponent([], [], [], ['ctab_connect.dll']);

        expect(component.onExtensionStep).toBe(true);
        expect(component.isLastStep).toBe(true);
    });

    it('submits pbos and extensions as separate lists', () => {
        const component = createComponent(['a.pbo'], ['a.pbo', 'b.pbo'], [], ['ctab_connect.dll']);
        component.next();
        component.selectAll();

        component.submit();

        expect(mockDialogRef.close).toHaveBeenCalledWith({ selectedPbos: ['a.pbo'], selectedExtensions: ['ctab_connect.dll'] });
    });

    it('selectAll only touches the current step', () => {
        const component = createComponent(['a.pbo', 'old.pbo'], ['a.pbo', 'b.pbo'], [], ['ctab_connect.dll']);

        component.selectAll();

        expect(component.pboSelection.find((p) => p.name === 'b.pbo')?.selected).toBe(true);
        expect(component.pboSelection.find((p) => p.name === 'old.pbo')?.selected).toBe(false);
        expect(component.extensionSelection[0].selected).toBe(false);
    });

    it('back returns to the PBO step', () => {
        const component = createComponent(['a.pbo'], ['a.pbo'], [], ['ctab_connect.dll']);

        component.next();
        component.back();

        expect(component.onExtensionStep).toBe(false);
    });

    it('is valid when only extensions are selected', () => {
        const component = createComponent([], [], [], ['ctab_connect.dll']);

        expect(component.valid).toBe(false);

        component.extensionSelection[0].selected = true;

        expect(component.valid).toBe(true);
    });

    it('handles null installed lists (first install case)', () => {
        const component = createComponent(null, ['a.pbo', 'b.pbo'], null, ['ctab_connect.dll']);

        expect(component.pboSelection).toHaveLength(2);
        expect(component.pboSelection.every((p) => p.state === 'new')).toBe(true);
        expect(component.pboSelection.every((p) => !p.selected)).toBe(true);
        expect(component.extensionSelection[0].state).toBe('new');
    });
});
