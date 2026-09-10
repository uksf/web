import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { OperationsCampaignsComponent } from './operations-campaigns.component';
import { CampaignsService } from '../../services/campaigns.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { CampaignStatus, MissionFileState } from '../../models/campaign';

describe('OperationsCampaignsComponent', () => {
    let component: OperationsCampaignsComponent;
    let service: any;
    let dialog: any;
    let dialogAfterClosed$: Subject<any>;

    const campaigns = [
        { id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current },
        { id: 'c2', name: 'Silent Talon', summary: '', status: CampaignStatus.Past }
    ];
    const missionsByCampaign: Record<string, any[]> = {
        c1: [
            { mission: { id: 'o1', operationId: 'op1', missionName: 'co40_x.Altis.pbo' }, missionFileState: MissionFileState.Present },
            { mission: { id: 'o2', operationId: 'op1', missionName: 'co30_y.Tanoa.pbo' }, missionFileState: MissionFileState.Present },
            { mission: { id: 'o4', operationId: 'op2', missionName: 'co40_dup.Altis.pbo' }, missionFileState: MissionFileState.Present }
        ],
        c2: [{ mission: { id: 'o3', operationId: 'op3', missionName: 'co40_z.Livonia.pbo' }, missionFileState: MissionFileState.Present }]
    };

    beforeEach(() => {
        dialogAfterClosed$ = new Subject();
        service = {
            getCampaigns: vi.fn().mockReturnValue(of(campaigns)),
            getCampaignMissions: vi.fn().mockImplementation((id: string) => of(missionsByCampaign[id] ?? []))
        };
        dialog = { open: vi.fn().mockReturnValue({ afterClosed: () => dialogAfterClosed$.asObservable() }) };
        TestBed.configureTestingModule({
            providers: [
                OperationsCampaignsComponent,
                { provide: CampaignsService, useValue: service },
                { provide: PermissionsService, useValue: { hasPermission: vi.fn().mockReturnValue(true) } },
                { provide: MatDialog, useValue: dialog }
            ]
        });
        component = TestBed.inject(OperationsCampaignsComponent);
    });

    afterEach(() => TestBed.resetTestingModule());

    it('loads campaigns on construction', () => {
        expect(service.getCampaigns).toHaveBeenCalled();
        expect(component.campaigns.length).toBe(2);
    });

    it('groups campaigns into sections by status', () => {
        expect(component.sections.find((s) => s.title === 'Current')?.items[0]?.name).toBe('Iron Sky');
        expect(component.sections.find((s) => s.title === 'Past')?.items[0]?.name).toBe('Silent Talon');
    });

    it('omits sections that have no campaigns', () => {
        // No Upcoming campaigns in the fixture.
        expect(component.sections.find((s) => s.title === 'Upcoming')).toBeUndefined();
    });

    it('marks the Past section as muted and Current as not', () => {
        expect(component.sections.find((s) => s.title === 'Current')?.muted).toBe(false);
        expect(component.sections.find((s) => s.title === 'Past')?.muted).toBe(true);
    });

    it('reads theatres from scoped missions of visible campaigns only', () => {
        expect(service.getCampaignMissions).toHaveBeenCalledWith('c1');
        expect(service.getCampaignMissions).toHaveBeenCalledWith('c2');
        expect(service.getCampaignMissions).not.toHaveBeenCalledWith('c3');
    });

    it('joins distinct map theatres for a multi-map campaign, de-duplicating', () => {
        // c1 missions span Altis (twice) + Tanoa -> "Altis · Tanoa", no duplicate Altis.
        expect(component.theatre(campaigns[0] as any)).toBe('Altis · Tanoa');
    });

    it('derives a single theatre for a single-map campaign', () => {
        expect(component.theatre(campaigns[1] as any)).toBe('Livonia');
    });

    it('returns empty theatre for a campaign with no ops', () => {
        expect(component.theatre({ id: 'unknown', name: 'X', summary: '', status: CampaignStatus.Current } as any)).toBe('');
    });

    it('skips missions with no map token when building theatres', () => {
        service.getCampaigns.mockReturnValue(of([{ id: 'c3', name: 'Empty File', summary: '', status: CampaignStatus.Current }]));
        service.getCampaignMissions.mockReturnValue(of([{ mission: { id: 'm9', operationId: 'op9', missionName: '' }, missionFileState: MissionFileState.Missing }]));
        const isolated = TestBed.inject(OperationsCampaignsComponent);
        isolated.load();
        expect(isolated.theatre({ id: 'c3', name: 'Empty File', summary: '', status: CampaignStatus.Current } as any)).toBe('');
    });

    it('createCampaign reloads the list when a campaign is saved', () => {
        service.getCampaigns.mockClear();
        component.createCampaign();
        dialogAfterClosed$.next(true);
        expect(service.getCampaigns).toHaveBeenCalled();
    });

    it('createCampaign does not reload when the modal is dismissed', () => {
        service.getCampaigns.mockClear();
        component.createCampaign();
        dialogAfterClosed$.next(undefined);
        expect(service.getCampaigns).not.toHaveBeenCalled();
    });
});
