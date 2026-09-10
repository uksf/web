import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsWarnoDetailComponent } from './operations-warno-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { CampaignMissionStatus } from '../../models/campaign';

describe('OperationsWarnoDetailComponent', () => {
    let service: any;
    let dialog: any;

    const missionDto = { mission: { id: 'm1', operationId: 'op1', title: 'Op 1', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'm', warno: '<p>original</p>', status: CampaignMissionStatus.Scheduled } };

    beforeEach(() => {
        service = {
            getMission: vi.fn().mockReturnValue(of(missionDto)),
            updateMission: vi.fn().mockReturnValue(of(undefined))
        };
        dialog = { open: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsWarnoDetailComponent,
                { provide: CampaignsService, useValue: service },
                { provide: MatDialog, useValue: dialog },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['campaignId', 'c1'], ['operationId', 'op1'], ['missionId', 'm1']]) } } }
            ]
        });
    });

    afterEach(() => TestBed.resetTestingModule());

    it('loads the mission on construction', () => {
        const component = TestBed.inject(OperationsWarnoDetailComponent);

        expect(service.getMission).toHaveBeenCalledWith('c1', 'op1', 'm1');
        expect(component.dto?.mission.warno).toBe('<p>original</p>');
        expect(component.backLink).toEqual(['/operations/campaigns', 'c1', 'operations', 'op1', 'missions', 'm1']);
    });

    it('edit seeds the draft from the current warno and enters editing mode', () => {
        const component = TestBed.inject(OperationsWarnoDetailComponent);

        component.edit();

        expect(component.draft).toBe('<p>original</p>');
        expect(component.editing).toBe(true);
    });

    it('save updates the mission, reloads, and exits editing mode on success', () => {
        const component = TestBed.inject(OperationsWarnoDetailComponent);
        component.edit();
        component.draft = '<p>updated</p>';

        component.save();

        expect(service.updateMission).toHaveBeenCalledWith('c1', 'op1', expect.objectContaining({ id: 'm1', warno: '<p>updated</p>' }));
        expect(component.pending).toBe(false);
        expect(component.editing).toBe(false);
        expect(service.getMission).toHaveBeenCalledTimes(2);
    });

    it('save surfaces an error modal and stays in editing mode when the update fails', () => {
        service.updateMission.mockReturnValue(throwError(() => ({ error: 'Boom' })));
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

        expect(service.updateMission).not.toHaveBeenCalled();
    });

    it('cancelEdit exits editing mode without saving', () => {
        const component = TestBed.inject(OperationsWarnoDetailComponent);
        component.edit();

        component.cancelEdit();

        expect(component.editing).toBe(false);
        expect(service.updateMission).not.toHaveBeenCalled();
    });
});
