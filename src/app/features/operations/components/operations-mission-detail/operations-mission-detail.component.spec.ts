import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { OperationsMissionDetailComponent } from './operations-mission-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { GameServersService } from '../../services/game-servers.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { CampaignMissionStatus, CampaignStatus, IntelScope, MissionFileState, OperationStatus } from '../../models/campaign';

describe('OperationsMissionDetailComponent', () => {
    let component: OperationsMissionDetailComponent;
    let service: any;
    let dialog: any;
    let router: any;
    let dialogAfterClosed$: Subject<any>;

    const missionDto = {
        mission: { id: 'm1', operationId: 'op1', title: 'Op 1', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'sweep.Altis.pbo', warno: '<p>w</p>', status: CampaignMissionStatus.Scheduled },
        missionFileState: MissionFileState.Present
    };
    const intelPage = { id: 'i2', scope: IntelScope.Mission, ownerId: 'm1', title: 'Recon', body: '' };

    beforeEach(() => {
        dialogAfterClosed$ = new Subject();
        service = {
            getMission: vi.fn().mockReturnValue(of(missionDto)),
            getCampaign: vi.fn().mockReturnValue(of({ id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current })),
            getOperation: vi.fn().mockReturnValue(of({ id: 'op1', campaignId: 'c1', title: 'Alpha', brief: '', status: OperationStatus.Current })),
            getIntel: vi.fn().mockReturnValue(of([intelPage])),
            launchMission: vi.fn().mockReturnValue(of([])),
            deleteMission: vi.fn().mockReturnValue(of(undefined)),
            deleteIntel: vi.fn().mockReturnValue(of(undefined))
        };
        dialog = { open: vi.fn().mockReturnValue({ afterClosed: () => dialogAfterClosed$.asObservable() }) };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsMissionDetailComponent,
                { provide: CampaignsService, useValue: service },
                { provide: GameServersService, useValue: { getServers: vi.fn().mockReturnValue(of({ servers: [{ id: 's1', name: 'Main Server' }] })) } },
                { provide: PermissionsService, useValue: { hasPermission: vi.fn().mockReturnValue(true) } },
                { provide: MatDialog, useValue: dialog },
                { provide: Router, useValue: router },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['campaignId', 'c1'], ['operationId', 'op1'], ['missionId', 'm1']]) } } }
            ]
        });
        component = TestBed.inject(OperationsMissionDetailComponent);
    });

    afterEach(() => TestBed.resetTestingModule());

    it('loads mission, campaign, operation and mission-scope intel', () => {
        expect(service.getMission).toHaveBeenCalledWith('c1', 'op1', 'm1');
        expect(service.getCampaign).toHaveBeenCalledWith('c1');
        expect(service.getOperation).toHaveBeenCalledWith('c1', 'op1');
        expect(service.getIntel).toHaveBeenCalledWith(IntelScope.Mission, 'm1');
        expect(component.dto?.mission.title).toBe('Op 1');
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
        service.getMission.mockClear();
        component.launch();
        expect(service.launchMission).toHaveBeenCalledWith('c1', 'op1', 'm1');
        expect(service.getMission).toHaveBeenCalled();
    });

    it('launch surfaces an error modal when the launch fails', () => {
        service.launchMission.mockReturnValue(throwError(() => ({ error: 'Boom' })));
        component.launch();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), { data: { message: 'Boom' } });
    });

    it('isLaunchDisabled getter is true for an autoLaunch mission when shift is not held', () => {
        component.dto = { ...missionDto, mission: { ...missionDto.mission, autoLaunch: true } } as any;
        expect(component.isLaunchDisabled).toBe(true);
    });

    it('isLaunchDisabled getter becomes false once shift is held', () => {
        component.dto = { ...missionDto, mission: { ...missionDto.mission, autoLaunch: true } } as any;
        component.onKey({ shiftKey: true } as KeyboardEvent);
        expect(component.isLaunchDisabled).toBe(false);
    });

    it('isLaunchDisabled getter is always false for a manual-only mission', () => {
        component.dto = missionDto as any;
        expect(component.isLaunchDisabled).toBe(false);
    });

    it('launchIcon getter shows a clock for a disabled auto-launch mission', () => {
        component.dto = { ...missionDto, mission: { ...missionDto.mission, autoLaunch: true } } as any;
        expect(component.launchIcon).toBe('schedule');
    });

    it('launchTooltip getter explains the hold-shift behaviour only when disabled', () => {
        component.dto = { ...missionDto, mission: { ...missionDto.mission, autoLaunch: true } } as any;
        expect(component.launchTooltip).toContain('Hold shift');
    });

    it('createIntel opens modal with Mission scope and missionId', () => {
        component.createIntel();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: expect.objectContaining({ scope: IntelScope.Mission, ownerId: 'm1' }) }));
    });

    it('editMission opens modal with campaignId, operationId and current mission', () => {
        component.editMission();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { campaignId: 'c1', operationId: 'op1', mission: missionDto.mission } }));
    });

    it('openWarno navigates to the warno child route', () => {
        component.openWarno();
        expect(router.navigate).toHaveBeenCalledWith(['warno'], expect.anything());
    });

    it('openIntel navigates to the intel child route', () => {
        component.openIntel(intelPage as any);
        expect(router.navigate).toHaveBeenCalledWith(['intel', 'i2'], expect.anything());
    });

    it('deleteMission deletes then navigates to the operation when confirmed', () => {
        component.deleteMission();
        dialogAfterClosed$.next(true);
        expect(service.deleteMission).toHaveBeenCalledWith('c1', 'op1', 'm1');
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c1', 'operations', 'op1']);
    });

    it('deleteMission does nothing when the confirmation is dismissed', () => {
        component.deleteMission();
        dialogAfterClosed$.next(false);
        expect(service.deleteMission).not.toHaveBeenCalled();
    });

    it('deleteIntel deletes then reloads when confirmed', () => {
        service.getIntel.mockClear();
        component.deleteIntel(intelPage as any);
        dialogAfterClosed$.next(true);
        expect(service.deleteIntel).toHaveBeenCalledWith('i2');
        expect(service.getIntel).toHaveBeenCalled();
    });

    it('isPastCampaign follows campaign status only, never operation or mission status', () => {
        component.campaign = { id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Past };
        expect(component.isPastCampaign).toBe(true);
        component.campaign = { id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current };
        expect(component.isPastCampaign).toBe(false);
        component.dto = { ...missionDto, mission: { ...missionDto.mission, status: CampaignMissionStatus.Complete } } as any;
        expect(component.isPastCampaign).toBe(false);
    });
});
