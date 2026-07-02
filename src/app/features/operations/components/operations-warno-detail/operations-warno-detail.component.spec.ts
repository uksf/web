import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsWarnoDetailComponent } from './operations-warno-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { OpStatus } from '../../models/campaign';

describe('OperationsWarnoDetailComponent', () => {
    let service: any;
    let dialog: any;

    const opDto = { op: { id: 'op1', campaignId: 'c1', title: 'Op 1', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'm', warno: '<p>original</p>', status: OpStatus.Scheduled } };

    beforeEach(() => {
        service = {
            getOp: vi.fn().mockReturnValue(of(opDto)),
            updateOp: vi.fn().mockReturnValue(of(undefined))
        };
        dialog = { open: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsWarnoDetailComponent,
                { provide: CampaignsService, useValue: service },
                { provide: MatDialog, useValue: dialog },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'c1'], ['opId', 'op1']]) } } }
            ]
        });
    });

    afterEach(() => TestBed.resetTestingModule());

    it('loads the op on construction', () => {
        const component = TestBed.inject(OperationsWarnoDetailComponent);

        expect(service.getOp).toHaveBeenCalledWith('op1');
        expect(component.dto?.op.warno).toBe('<p>original</p>');
    });

    it('edit seeds the draft from the current warno and enters editing mode', () => {
        const component = TestBed.inject(OperationsWarnoDetailComponent);

        component.edit();

        expect(component.draft).toBe('<p>original</p>');
        expect(component.editing).toBe(true);
    });

    it('save updates the op, reloads, and exits editing mode on success', () => {
        const component = TestBed.inject(OperationsWarnoDetailComponent);
        component.edit();
        component.draft = '<p>updated</p>';

        component.save();

        expect(service.updateOp).toHaveBeenCalledWith(expect.objectContaining({ id: 'op1', warno: '<p>updated</p>' }));
        expect(component.pending).toBe(false);
        expect(component.editing).toBe(false);
        expect(service.getOp).toHaveBeenCalledTimes(2);
    });

    it('save surfaces an error modal and stays in editing mode when the update fails', () => {
        service.updateOp.mockReturnValue(throwError(() => ({ error: 'Boom' })));
        const component = TestBed.inject(OperationsWarnoDetailComponent);
        component.edit();
        component.draft = '<p>updated</p>';

        component.save();

        expect(component.pending).toBe(false);
        expect(component.editing).toBe(true);
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), { data: { message: 'Boom' } });
    });

    it('save does nothing when already pending', () => {
        const component = TestBed.inject(OperationsWarnoDetailComponent);
        component.edit();
        component.pending = true;

        component.save();

        expect(service.updateOp).not.toHaveBeenCalled();
    });

    it('cancelEdit exits editing mode without saving', () => {
        const component = TestBed.inject(OperationsWarnoDetailComponent);
        component.edit();

        component.cancelEdit();

        expect(component.editing).toBe(false);
        expect(service.updateOp).not.toHaveBeenCalled();
    });
});
