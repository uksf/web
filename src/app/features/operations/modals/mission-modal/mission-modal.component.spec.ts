import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MissionModalComponent } from './mission-modal.component';
import { CampaignsService } from '../../services/campaigns.service';
import { GameServersService } from '../../services/game-servers.service';
import { MissionsService } from '../../services/missions.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignMissionStatus } from '../../models/campaign';

describe('MissionModalComponent', () => {
    let component: MissionModalComponent;
    let service: any;
    let dialogRef: any;

    function setup(data: any) {
        service = { addMission: vi.fn().mockReturnValue(of(undefined)), updateMission: vi.fn().mockReturnValue(of(undefined)) };
        dialogRef = { close: vi.fn() };
        const servers = {
            getServers: vi.fn().mockReturnValue(
                of({ servers: [{ id: 'main1', name: 'Main Server' }, { id: 's2', name: 'Other' }], missions: [], instanceCount: 0 })
            )
        };
        const missions = {
            getActiveMissions: vi.fn().mockReturnValue(
                of([{ map: 'Altis', name: 'breakpasses', path: 'breakpasses.Altis.pbo', size: 1, lastModified: '' }])
            )
        };
        TestBed.configureTestingModule({
            providers: [
                MissionModalComponent,
                { provide: CampaignsService, useValue: service },
                { provide: GameServersService, useValue: servers },
                { provide: MissionsService, useValue: missions },
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        });
        component = TestBed.inject(MissionModalComponent);
    }

    afterEach(() => TestBed.resetTestingModule());

    it('create mode defaults serverId to Main Server and a future 19:00 date', () => {
        setup({ campaignId: 'c1', operationId: 'op1' });
        expect(component.model.serverId).toBe('main1');
        expect(component.scheduledDate).toBeInstanceOf(Date);
        expect(component.scheduledDate!.getHours()).not.toBeNaN();
    });

    it('create mode defaults autoLaunch to false', () => {
        setup({ campaignId: 'c1', operationId: 'op1' });
        expect(component.model.autoLaunch).toBe(false);
    });

    it('create mode seeds operationId and does not store campaignId on the mission', () => {
        setup({ campaignId: 'c1', operationId: 'op1' });
        expect(component.model.operationId).toBe('op1');
        expect((component.model as any).campaignId).toBeUndefined();
    });

    it('edit mode prefills autoLaunch from the mission', () => {
        setup({
            campaignId: 'c1',
            operationId: 'op1',
            mission: {
                id: 'm1',
                operationId: 'op1',
                title: 'Op 1',
                scheduledTime: '2026-06-28T18:00:00Z',
                serverId: 's2',
                missionName: 'm.Altis.pbo',
                warno: '',
                status: CampaignMissionStatus.Scheduled,
                autoLaunch: true
            }
        });
        expect(component.model.autoLaunch).toBe(true);
    });

    it('create mode sets serverValue IDropdownElement so the value is the Main Server id', () => {
        setup({ campaignId: 'c1', operationId: 'op1' });
        expect(component.serverValue?.value).toBe('main1');
    });

    it('edit mode prefills model and isEdit flag', () => {
        setup({
            campaignId: 'c1',
            operationId: 'op1',
            mission: {
                id: 'm1',
                operationId: 'op1',
                title: 'Op 1',
                scheduledTime: '2026-06-28T18:00:00Z',
                serverId: 's2',
                missionName: 'm.Altis.pbo',
                warno: '',
                status: CampaignMissionStatus.Scheduled
            }
        });
        expect(component.isEdit).toBe(true);
        expect(component.model.title).toBe('Op 1');
        expect(component.model.serverId).toBe('s2');
    });

    it('submit (create) passes serverId from serverValue.value, missionName from missionValue.value, and ISO scheduledTime to addMission', () => {
        setup({ campaignId: 'c1', operationId: 'op1' });
        component.model.title = 'Test Op';
        component.missionValue = { value: 'breakpasses.Altis.pbo', displayValue: 'breakpasses · Altis' };
        component.submit();
        expect(service.addMission).toHaveBeenCalledWith(
            'c1',
            'op1',
            expect.objectContaining({
                operationId: 'op1',
                serverId: 'main1',
                missionName: 'breakpasses.Altis.pbo',
                scheduledTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
            })
        );
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('submit (create) accepts an empty mission filename', () => {
        setup({ campaignId: 'c1', operationId: 'op1' });
        component.model.title = 'Test Op';
        component.missionValue = null;
        component.submit();
        expect(service.addMission).toHaveBeenCalledWith('c1', 'op1', expect.objectContaining({ missionName: '' }));
    });

    it('submit does nothing without a title', () => {
        setup({ campaignId: 'c1', operationId: 'op1' });
        component.submit();
        expect(service.addMission).not.toHaveBeenCalled();
    });

    it('create mode advances to the upcoming Saturday from a weekday, before 19:00', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 10, 12, 0, 0)); // Wed 10 June, local noon
        setup({ campaignId: 'c1', operationId: 'op1' });
        expect(component.scheduledDate!.getDay()).toBe(6);
        expect(component.scheduledDate!.getDate()).toBe(13);
        expect(component.scheduledDate!.getHours()).toBe(19);
        vi.useRealTimers();
    });

    it('create mode advances to the upcoming Saturday from a weekday, after 19:00', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 10, 20, 0, 0)); // Wed 10 June, local 20:00
        setup({ campaignId: 'c1', operationId: 'op1' });
        expect(component.scheduledDate!.getDay()).toBe(6);
        expect(component.scheduledDate!.getDate()).toBe(13);
        expect(component.scheduledDate!.getHours()).toBe(19);
        vi.useRealTimers();
    });

    it('create mode uses today when today is Saturday before 19:00', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 13, 12, 0, 0)); // Sat 13 June, local noon
        setup({ campaignId: 'c1', operationId: 'op1' });
        expect(component.scheduledDate!.getDate()).toBe(13);
        expect(component.scheduledDate!.getHours()).toBe(19);
        vi.useRealTimers();
    });

    it('create mode rolls to next Saturday when today is Saturday after 19:00', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 13, 20, 0, 0)); // Sat 13 June, local 20:00
        setup({ campaignId: 'c1', operationId: 'op1' });
        expect(component.scheduledDate!.getDate()).toBe(20);
        expect(component.scheduledDate!.getHours()).toBe(19);
        vi.useRealTimers();
    });
});
