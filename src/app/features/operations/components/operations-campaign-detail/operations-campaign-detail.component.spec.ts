import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsCampaignDetailComponent } from './operations-campaign-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { ActivatedRoute } from '@angular/router';
import { CampaignStatus, IntelScope, MissionFileState, OpStatus } from '../../models/campaign';

describe('OperationsCampaignDetailComponent', () => {
    let component: OperationsCampaignDetailComponent;
    let service: any;
    let dialog: any;
    let router: any;
    let dialogAfterClosed$: Subject<any>;

    const campaign = { id: 'c1', name: 'Iron Sky', summary: '<p>b</p>', status: CampaignStatus.Current };
    const opDto = {
        op: { id: 'op1', campaignId: 'c1', title: 'Op 1', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'sweep.Altis.pbo', warno: '', status: OpStatus.Scheduled },
        missionFileState: MissionFileState.Present
    };
    const intelPage = { id: 'i1', scope: IntelScope.Campaign, ownerId: 'c1', title: 'Enemy', body: '' };

    beforeEach(() => {
        dialogAfterClosed$ = new Subject();
        service = {
            getCampaign: vi.fn().mockReturnValue(of(campaign)),
            getOps: vi.fn().mockReturnValue(of([opDto])),
            getIntel: vi.fn().mockReturnValue(of([intelPage])),
            launchOp: vi.fn().mockReturnValue(of([])),
            deleteCampaign: vi.fn().mockReturnValue(of(undefined)),
            deleteOp: vi.fn().mockReturnValue(of(undefined)),
            deleteIntel: vi.fn().mockReturnValue(of(undefined))
        };
        dialog = { open: vi.fn().mockReturnValue({ afterClosed: () => dialogAfterClosed$.asObservable() }) };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsCampaignDetailComponent,
                { provide: CampaignsService, useValue: service },
                { provide: PermissionsService, useValue: { hasPermission: vi.fn().mockReturnValue(true) } },
                { provide: MatDialog, useValue: dialog },
                { provide: Router, useValue: router },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'c1']]) } } }
            ]
        });
        component = TestBed.inject(OperationsCampaignDetailComponent);
    });

    afterEach(() => TestBed.resetTestingModule());

    it('loads campaign, ops and intel for the route id', () => {
        expect(service.getCampaign).toHaveBeenCalledWith('c1');
        expect(service.getOps).toHaveBeenCalledWith('c1');
        expect(service.getIntel).toHaveBeenCalledWith(IntelScope.Campaign, 'c1');
        expect(component.campaign?.name).toBe('Iron Sky');
        expect(component.ops.length).toBe(1);
        expect(component.intel.length).toBe(1);
    });

    it('exposes OpStatus, MissionFileState + CampaignStatus enums to the template', () => {
        expect(component.OpStatus.Complete).toBe(OpStatus.Complete);
        expect(component.MissionFileState.Missing).toBe(MissionFileState.Missing);
        expect(component.CampaignStatus.Upcoming).toBe(CampaignStatus.Upcoming);
    });

    it.each([
        [CampaignStatus.Current, 'Current'],
        [CampaignStatus.Upcoming, 'Upcoming'],
        [CampaignStatus.Past, 'Past']
    ])('statusLabel maps %s to %s', (status, label) => {
        component.campaign = { ...campaign, status };
        expect(component.statusLabel).toBe(label);
    });

    it('derives op map colour + name from the mission file', () => {
        // sweep.Altis.pbo -> Altis (known map colour)
        expect(component.mapName(opDto.op as any)).toBe('Altis');
        expect(component.mapColour(opDto.op as any)).toBe('#c2a878');
    });

    it('launch reloads the campaign on success', () => {
        service.getCampaign.mockClear();
        component.launch(opDto as any);
        expect(service.launchOp).toHaveBeenCalledWith('op1');
        expect(service.getCampaign).toHaveBeenCalled();
    });

    it('launch surfaces an error modal when the launch fails', () => {
        service.launchOp.mockReturnValue(throwError(() => ({ error: 'Boom' })));
        component.launch(opDto as any);
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), { data: { message: 'Boom' } });
    });

    it('createIntel opens modal with Campaign scope and campaignId', () => {
        component.createIntel();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: expect.objectContaining({ scope: IntelScope.Campaign, ownerId: 'c1' }) }));
    });

    it('createOp opens modal seeded with the campaignId', () => {
        component.createOp();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { campaignId: 'c1' } }));
    });

    it('editCampaign opens modal with the current campaign', () => {
        component.editCampaign();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { campaign: component.campaign } }));
    });

    it('openOp navigates to the op detail route', () => {
        component.openOp(opDto as any);
        expect(router.navigate).toHaveBeenCalledWith(['ops', 'op1'], expect.anything());
    });

    it('openIntel navigates to the intel detail route', () => {
        component.openIntel(intelPage as any);
        expect(router.navigate).toHaveBeenCalledWith(['intel', 'i1'], expect.anything());
    });

    it('deleteCampaign deletes then navigates to the list when confirmed', () => {
        component.deleteCampaign();
        dialogAfterClosed$.next(true);
        expect(service.deleteCampaign).toHaveBeenCalledWith('c1');
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns']);
    });

    it('deleteCampaign does nothing when the confirmation is dismissed', () => {
        component.deleteCampaign();
        dialogAfterClosed$.next(false);
        expect(service.deleteCampaign).not.toHaveBeenCalled();
    });

    it('deleteOp deletes then reloads when confirmed', () => {
        service.getOps.mockClear();
        component.deleteOp(opDto as any);
        dialogAfterClosed$.next(true);
        expect(service.deleteOp).toHaveBeenCalledWith('op1');
        expect(service.getOps).toHaveBeenCalled();
    });

    it('deleteIntel deletes then reloads when confirmed', () => {
        service.getIntel.mockClear();
        component.deleteIntel(intelPage as any);
        dialogAfterClosed$.next(true);
        expect(service.deleteIntel).toHaveBeenCalledWith('i1');
        expect(service.getIntel).toHaveBeenCalled();
    });
});
