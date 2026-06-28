import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OpModalComponent } from './op-modal.component';
import { CampaignsService } from '../../services/campaigns.service';
import { GameServersService } from '../../services/game-servers.service';
import { MissionsService } from '../../services/missions.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OpStatus } from '../../models/campaign';

describe('OpModalComponent', () => {
    let component: OpModalComponent;
    let service: any;
    let dialogRef: any;

    function setup(data: any) {
        service = { addOp: vi.fn().mockReturnValue(of(undefined)), updateOp: vi.fn().mockReturnValue(of(undefined)) };
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
                OpModalComponent,
                { provide: CampaignsService, useValue: service },
                { provide: GameServersService, useValue: servers },
                { provide: MissionsService, useValue: missions },
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        });
        component = TestBed.inject(OpModalComponent);
    }

    afterEach(() => TestBed.resetTestingModule());

    it('create mode defaults serverId to Main Server and a future 19:00 date', () => {
        setup({ campaignId: 'c1' });
        expect(component.model.serverId).toBe('main1');
        expect(component.scheduledDate).toBeInstanceOf(Date);
        expect(component.scheduledDate!.getHours()).not.toBeNaN();
    });

    it('create mode sets serverValue IDropdownElement so the value is the Main Server id', () => {
        setup({ campaignId: 'c1' });
        expect(component.serverValue?.value).toBe('main1');
    });

    it('edit mode prefills model and isEdit flag', () => {
        setup({
            campaignId: 'c1',
            op: {
                id: 'op1',
                campaignId: 'c1',
                title: 'Op 1',
                scheduledTime: '2026-06-28T18:00:00Z',
                serverId: 's2',
                missionName: 'm.Altis.pbo',
                warno: '',
                status: OpStatus.Scheduled
            }
        });
        expect(component.isEdit).toBe(true);
        expect(component.model.title).toBe('Op 1');
        expect(component.model.serverId).toBe('s2');
    });

    it('submit (create) passes serverId from serverValue.value, missionName from missionValue.value, and ISO scheduledTime to addOp', () => {
        setup({ campaignId: 'c1' });
        component.model.title = 'Test Op';
        component.missionValue = { value: 'breakpasses.Altis.pbo', displayValue: 'breakpasses · Altis' };
        component.submit();
        expect(service.addOp).toHaveBeenCalledWith(
            expect.objectContaining({
                serverId: 'main1',
                missionName: 'breakpasses.Altis.pbo',
                scheduledTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
            })
        );
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });
});
