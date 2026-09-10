import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsOperationDetailComponent } from './operations-operation-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { ActivatedRoute } from '@angular/router';
import { CampaignMissionStatus, CampaignStatus, IntelScope, MissionFileState, OperationStatus } from '../../models/campaign';

describe('OperationsOperationDetailComponent', () => {
    let component: OperationsOperationDetailComponent;
    let service: any;
    let dialog: any;
    let router: any;
    let dialogAfterClosed$: Subject<any>;

    const campaign = { id: 'c1', name: 'Iron Sky', summary: '<p>b</p>', status: CampaignStatus.Current };
    const operation = { id: 'op1', campaignId: 'c1', title: 'Alpha', brief: '<p>conduct</p>', status: OperationStatus.Current };
    const missionDto = {
        mission: { id: 'm1', operationId: 'op1', title: 'Op 1', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'sweep.Altis.pbo', warno: '', status: CampaignMissionStatus.Scheduled, autoLaunch: false },
        missionFileState: MissionFileState.Present
    };
    const siblingMissionDto = {
        mission: { id: 'm2', operationId: 'op1', title: 'Op 2', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'other.Tanoa.pbo', warno: '', status: CampaignMissionStatus.Scheduled, autoLaunch: false },
        missionFileState: MissionFileState.Present
    };
    const intelPage = { id: 'i1', scope: IntelScope.Operation, ownerId: 'op1', title: 'Enemy', body: '' };

    beforeEach(() => {
        dialogAfterClosed$ = new Subject();
        service = {
            getCampaign: vi.fn().mockReturnValue(of(campaign)),
            getOperation: vi.fn().mockReturnValue(of(operation)),
            getMissions: vi.fn().mockReturnValue(of([missionDto, siblingMissionDto])),
            getIntel: vi.fn().mockReturnValue(of([intelPage])),
            launchMission: vi.fn().mockReturnValue(of([])),
            deleteOperation: vi.fn().mockReturnValue(of(undefined)),
            deleteMission: vi.fn().mockReturnValue(of(undefined)),
            deleteIntel: vi.fn().mockReturnValue(of(undefined))
        };
        dialog = { open: vi.fn().mockReturnValue({ afterClosed: () => dialogAfterClosed$.asObservable() }) };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsOperationDetailComponent,
                { provide: CampaignsService, useValue: service },
                { provide: PermissionsService, useValue: { hasPermission: vi.fn().mockReturnValue(true) } },
                { provide: MatDialog, useValue: dialog },
                { provide: Router, useValue: router },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['campaignId', 'c1'], ['operationId', 'op1']]) } } }
            ]
        });
        component = TestBed.inject(OperationsOperationDetailComponent);
    });

    afterEach(() => TestBed.resetTestingModule());

    it('loads campaign, operation, missions and operation-scope intel for the route ids', () => {
        expect(service.getCampaign).toHaveBeenCalledWith('c1');
        expect(service.getOperation).toHaveBeenCalledWith('c1', 'op1');
        expect(service.getMissions).toHaveBeenCalledWith('c1', 'op1');
        expect(service.getIntel).toHaveBeenCalledWith(IntelScope.Operation, 'op1');
        expect(component.operation?.title).toBe('Alpha');
        expect(component.missions.length).toBe(2);
        expect(component.intel.length).toBe(1);
    });

    it('exposes CampaignMissionStatus, MissionFileState + CampaignStatus enums to the template', () => {
        expect(component.CampaignMissionStatus.Complete).toBe(CampaignMissionStatus.Complete);
        expect(component.MissionFileState.Missing).toBe(MissionFileState.Missing);
        expect(component.CampaignStatus.Upcoming).toBe(CampaignStatus.Upcoming);
    });

    it.each([
        [OperationStatus.Current, 'Current'],
        [OperationStatus.Upcoming, 'Upcoming'],
        [OperationStatus.Past, 'Past']
    ])('statusLabel maps %s to %s', (status, label) => {
        component.operation = { ...operation, status };
        expect(component.statusLabel).toBe(label);
    });

    it('derives mission map colour + name from the mission file', () => {
        expect(component.mapName(missionDto.mission as any)).toBe('Altis');
        expect(component.mapColour(missionDto.mission as any)).toBe('#c2a878');
    });

    it('launch reloads the operation on success', () => {
        service.getOperation.mockClear();
        component.launch(missionDto as any);
        expect(service.launchMission).toHaveBeenCalledWith('c1', 'op1', 'm1');
        expect(service.launchMission).not.toHaveBeenCalledWith('c1', 'op1', 'm2');
        expect(service.getOperation).toHaveBeenCalled();
    });

    it('launch surfaces an error modal when the launch fails', () => {
        service.launchMission.mockReturnValue(throwError(() => ({ error: 'Boom' })));
        component.launch(missionDto as any);
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), { data: { message: 'Boom' } });
    });

    it('isLaunchDisabled is true for an autoLaunch mission when shift is not held', () => {
        const autoDto = { ...missionDto, mission: { ...missionDto.mission, autoLaunch: true } };
        expect(component.isLaunchDisabled(autoDto as any)).toBe(true);
    });

    it('isLaunchDisabled becomes false once shift is held', () => {
        const autoDto = { ...missionDto, mission: { ...missionDto.mission, autoLaunch: true } };
        component.onKey({ shiftKey: true } as KeyboardEvent);
        expect(component.isLaunchDisabled(autoDto as any)).toBe(false);
    });

    it('isLaunchDisabled is always false for a manual-only mission', () => {
        expect(component.isLaunchDisabled(missionDto as any)).toBe(false);
    });

    it('launchIcon shows a clock for a disabled auto-launch mission, play_arrow otherwise', () => {
        const autoDto = { ...missionDto, mission: { ...missionDto.mission, autoLaunch: true } };
        expect(component.launchIcon(autoDto as any)).toBe('schedule');
        expect(component.launchIcon(missionDto as any)).toBe('play_arrow');
    });

    it('launchTooltip explains the hold-shift behaviour only when disabled', () => {
        const autoDto = { ...missionDto, mission: { ...missionDto.mission, autoLaunch: true } };
        expect(component.launchTooltip(autoDto as any)).toContain('Hold shift');
        expect(component.launchTooltip(missionDto as any)).toBe('Launch');
    });

    it('createIntel opens modal with Operation scope and operationId', () => {
        component.createIntel();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: expect.objectContaining({ scope: IntelScope.Operation, ownerId: 'op1' }) }));
    });

    it('createMission opens modal seeded with campaignId and operationId', () => {
        component.createMission();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { campaignId: 'c1', operationId: 'op1' } }));
    });

    it('editOperation opens modal with the current operation', () => {
        component.editOperation();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { campaignId: 'c1', operation: component.operation } }));
    });

    it('openMission navigates to the mission detail route', () => {
        component.openMission(missionDto as any);
        expect(router.navigate).toHaveBeenCalledWith(['missions', 'm1'], expect.anything());
    });

    it('openIntel navigates to the intel detail route', () => {
        component.openIntel(intelPage as any);
        expect(router.navigate).toHaveBeenCalledWith(['intel', 'i1'], expect.anything());
    });

    it('deleteOperation deletes then navigates to the campaign when confirmed', () => {
        component.deleteOperation();
        dialogAfterClosed$.next(true);
        expect(service.deleteOperation).toHaveBeenCalledWith('c1', 'op1');
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c1']);
    });

    it('deleteOperation does nothing when the confirmation is dismissed', () => {
        component.deleteOperation();
        dialogAfterClosed$.next(false);
        expect(service.deleteOperation).not.toHaveBeenCalled();
    });

    it('deleteMission deletes the named mission then reloads when confirmed', () => {
        service.getMissions.mockClear();
        component.deleteMission(missionDto as any);
        dialogAfterClosed$.next(true);
        expect(service.deleteMission).toHaveBeenCalledWith('c1', 'op1', 'm1');
        expect(service.deleteMission).not.toHaveBeenCalledWith('c1', 'op1', 'm2');
        expect(service.getMissions).toHaveBeenCalled();
    });

    it('deleteIntel deletes then reloads when confirmed', () => {
        service.getIntel.mockClear();
        component.deleteIntel(intelPage as any);
        dialogAfterClosed$.next(true);
        expect(service.deleteIntel).toHaveBeenCalledWith('i1');
        expect(service.getIntel).toHaveBeenCalled();
    });

    it.each([OperationStatus.Upcoming, OperationStatus.Current, OperationStatus.Past])(
        'Past campaign gates new mission, operation delete and add-intel even when operation is %s',
        (status) => {
            component.campaign = { ...campaign, status: CampaignStatus.Past };
            component.operation = { ...operation, status };
            expect(component.isPastCampaign).toBe(true);
            expect(component.isLaunchDisabled(missionDto as any)).toBe(false);
        }
    );

    it.each([OperationStatus.Upcoming, OperationStatus.Current, OperationStatus.Past])(
        'Current campaign keeps mission create/delete-operation/add-intel when operation is %s',
        (status) => {
            component.campaign = { ...campaign, status: CampaignStatus.Current };
            component.operation = { ...operation, status };
            expect(component.isPastCampaign).toBe(false);
        }
    );
});
