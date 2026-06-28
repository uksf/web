import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { OperationsCampaignDetailComponent } from './operations-campaign-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { CampaignStatus, MissionFileState, OpStatus } from '../../models/campaign';

describe('OperationsCampaignDetailComponent', () => {
    let component: OperationsCampaignDetailComponent;
    let service: any;
    let dialogAfterClosed$: Subject<any>;

    const campaign = { id: 'c1', name: 'Iron Sky', brief: '<p>b</p>', status: CampaignStatus.Active, theatre: 'takistan' };
    const opDto = {
        op: { id: 'op1', campaignId: 'c1', title: 'Op 1', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'm.Altis.pbo', warno: '', status: OpStatus.Scheduled },
        missionFileState: MissionFileState.Present
    };

    beforeEach(() => {
        dialogAfterClosed$ = new Subject();
        service = {
            getCampaign: vi.fn().mockReturnValue(of(campaign)),
            getOps: vi.fn().mockReturnValue(of([opDto])),
            getIntel: vi.fn().mockReturnValue(of([])),
            launchOp: vi.fn().mockReturnValue(of([]))
        };
        TestBed.configureTestingModule({
            providers: [
                OperationsCampaignDetailComponent,
                { provide: CampaignsService, useValue: service },
                { provide: PermissionsService, useValue: { hasPermission: vi.fn().mockReturnValue(true) } },
                { provide: MatDialog, useValue: { open: vi.fn().mockReturnValue({ afterClosed: () => dialogAfterClosed$.asObservable() }) } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'c1']]) } } }
            ]
        });
        component = TestBed.inject(OperationsCampaignDetailComponent);
    });

    it('loads campaign, ops and intel for the route id', () => {
        expect(service.getCampaign).toHaveBeenCalledWith('c1');
        expect(service.getOps).toHaveBeenCalledWith('c1');
        expect(component.campaign?.name).toBe('Iron Sky');
        expect(component.ops.length).toBe(1);
    });

    it('launch calls the service for the op', () => {
        component.launch(opDto as any);
        expect(service.launchOp).toHaveBeenCalledWith('op1');
    });

    it('exposes OpStatus + MissionFileState enums to the template', () => {
        expect(component.OpStatus.Complete).toBe(OpStatus.Complete);
        expect(component.MissionFileState.Missing).toBe(MissionFileState.Missing);
    });
});
