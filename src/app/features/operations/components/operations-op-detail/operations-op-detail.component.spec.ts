import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { OperationsOpDetailComponent } from './operations-op-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { GameServersService } from '../../services/game-servers.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { CampaignStatus, IntelScope, MissionFileState, OpStatus } from '../../models/campaign';

describe('OperationsOpDetailComponent', () => {
    let component: OperationsOpDetailComponent;
    let service: any;
    let dialog: any;
    let router: any;
    let dialogAfterClosed$: Subject<any>;

    const opDto = {
        op: { id: 'op1', campaignId: 'c1', title: 'Op 1', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'sweep.Altis.pbo', warno: '<p>w</p>', status: OpStatus.Scheduled },
        missionFileState: MissionFileState.Present
    };
    const intelPage = { id: 'i2', scope: IntelScope.Op, ownerId: 'op1', title: 'Recon', body: '' };

    beforeEach(() => {
        dialogAfterClosed$ = new Subject();
        service = {
            getOp: vi.fn().mockReturnValue(of(opDto)),
            getCampaign: vi.fn().mockReturnValue(of({ id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current })),
            getIntel: vi.fn().mockReturnValue(of([intelPage])),
            launchOp: vi.fn().mockReturnValue(of([])),
            deleteOp: vi.fn().mockReturnValue(of(undefined)),
            deleteIntel: vi.fn().mockReturnValue(of(undefined))
        };
        dialog = { open: vi.fn().mockReturnValue({ afterClosed: () => dialogAfterClosed$.asObservable() }) };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsOpDetailComponent,
                { provide: CampaignsService, useValue: service },
                { provide: GameServersService, useValue: { getServers: vi.fn().mockReturnValue(of({ servers: [{ id: 's1', name: 'Main Server' }] })) } },
                { provide: PermissionsService, useValue: { hasPermission: vi.fn().mockReturnValue(true) } },
                { provide: MatDialog, useValue: dialog },
                { provide: Router, useValue: router },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'c1'], ['opId', 'op1']]) } } }
            ]
        });
        component = TestBed.inject(OperationsOpDetailComponent);
    });

    afterEach(() => TestBed.resetTestingModule());

    it('loads op, campaign and op-scope intel', () => {
        expect(service.getOp).toHaveBeenCalledWith('op1');
        expect(service.getCampaign).toHaveBeenCalledWith('c1');
        expect(service.getIntel).toHaveBeenCalledWith(IntelScope.Op, 'op1');
        expect(component.dto?.op.title).toBe('Op 1');
        expect(component.campaign?.name).toBe('Iron Sky');
        expect(component.intel.length).toBe(1);
    });

    it('resolves serverName from the server list, falling back to the id', () => {
        expect(component.serverName).toBe('Main Server');
    });

    it('derives stripe colour + map name from the mission file', () => {
        expect(component.mapName).toBe('Altis');
        expect(component.stripe).toBe('#c2a878');
    });

    it('launch calls the service and reloads on success', () => {
        service.getOp.mockClear();
        component.launch();
        expect(service.launchOp).toHaveBeenCalledWith('op1');
        expect(service.getOp).toHaveBeenCalled();
    });

    it('launch surfaces an error modal when the launch fails', () => {
        service.launchOp.mockReturnValue(throwError(() => ({ error: 'Boom' })));
        component.launch();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), { data: { message: 'Boom' } });
    });

    it('createIntel opens modal with Op scope and opId', () => {
        component.createIntel();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: expect.objectContaining({ scope: IntelScope.Op, ownerId: 'op1' }) }));
    });

    it('editOp opens modal with the campaignId and current op', () => {
        component.editOp();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { campaignId: 'c1', op: opDto.op } }));
    });

    it('openWarno navigates to the warno child route', () => {
        component.openWarno();
        expect(router.navigate).toHaveBeenCalledWith(['warno'], expect.anything());
    });

    it('openIntel navigates to the intel child route', () => {
        component.openIntel(intelPage as any);
        expect(router.navigate).toHaveBeenCalledWith(['intel', 'i2'], expect.anything());
    });

    it('deleteOp deletes then navigates to the campaign when confirmed', () => {
        component.deleteOp();
        dialogAfterClosed$.next(true);
        expect(service.deleteOp).toHaveBeenCalledWith('op1');
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c1']);
    });

    it('deleteOp does nothing when the confirmation is dismissed', () => {
        component.deleteOp();
        dialogAfterClosed$.next(false);
        expect(service.deleteOp).not.toHaveBeenCalled();
    });

    it('deleteIntel deletes then reloads when confirmed', () => {
        service.getIntel.mockClear();
        component.deleteIntel(intelPage as any);
        dialogAfterClosed$.next(true);
        expect(service.deleteIntel).toHaveBeenCalledWith('i2');
        expect(service.getIntel).toHaveBeenCalled();
    });
});
