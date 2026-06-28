import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OperationsOpDetailComponent } from './operations-op-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { CampaignStatus, MissionFileState, OpStatus } from '../../models/campaign';

describe('OperationsOpDetailComponent', () => {
    let component: OperationsOpDetailComponent;
    let service: any;

    const opDto = {
        op: { id: 'op1', campaignId: 'c1', title: 'Op 1', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'm.Altis.pbo', warno: '<p>w</p>', status: OpStatus.Scheduled },
        missionFileState: MissionFileState.Present
    };

    beforeEach(() => {
        service = {
            getOp: vi.fn().mockReturnValue(of(opDto)),
            getCampaign: vi.fn().mockReturnValue(of({ id: 'c1', name: 'Iron Sky', brief: '', status: CampaignStatus.Active })),
            getIntel: vi.fn().mockReturnValue(of([])),
            launchOp: vi.fn().mockReturnValue(of([]))
        };
        TestBed.configureTestingModule({
            providers: [
                OperationsOpDetailComponent,
                { provide: CampaignsService, useValue: service },
                { provide: PermissionsService, useValue: { hasPermission: vi.fn().mockReturnValue(true) } },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'c1'], ['opId', 'op1']]) } } }
            ]
        });
        component = TestBed.inject(OperationsOpDetailComponent);
    });

    it('loads op, campaign and op-scope intel', () => {
        expect(service.getOp).toHaveBeenCalledWith('op1');
        expect(service.getCampaign).toHaveBeenCalledWith('c1');
        expect(component.dto?.op.title).toBe('Op 1');
        expect(component.campaign?.name).toBe('Iron Sky');
    });

    it('launch calls service', () => {
        component.launch();
        expect(service.launchOp).toHaveBeenCalledWith('op1');
    });
});
