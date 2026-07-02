import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { OperationsCampaignsComponent } from './operations-campaigns.component';
import { CampaignsService } from '../../services/campaigns.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { CampaignStatus } from '../../models/campaign';

describe('OperationsCampaignsComponent', () => {
    let component: OperationsCampaignsComponent;
    let service: any;
    let dialog: any;
    let dialogAfterClosed$: Subject<any>;

    const campaigns = [
        { id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current },
        { id: 'c2', name: 'Silent Talon', summary: '', status: CampaignStatus.Past }
    ];
    const ops = [
        { op: { id: 'o1', campaignId: 'c1', missionName: 'co40_x.Altis.pbo' } },
        { op: { id: 'o2', campaignId: 'c1', missionName: 'co30_y.Tanoa.pbo' } },
        { op: { id: 'o3', campaignId: 'c2', missionName: 'co40_z.Livonia.pbo' } },
        { op: { id: 'o4', campaignId: 'c1', missionName: 'co40_dup.Altis.pbo' } }
    ];

    beforeEach(() => {
        dialogAfterClosed$ = new Subject();
        service = {
            getCampaigns: vi.fn().mockReturnValue(of(campaigns)),
            getAllOps: vi.fn().mockReturnValue(of(ops))
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

    it('joins distinct map theatres for a multi-map campaign, de-duplicating', () => {
        // c1 ops span Altis (twice) + Tanoa -> "Altis · Tanoa", no duplicate Altis.
        expect(component.theatre(campaigns[0] as any)).toBe('Altis · Tanoa');
    });

    it('derives a single theatre for a single-map campaign', () => {
        expect(component.theatre(campaigns[1] as any)).toBe('Livonia');
    });

    it('returns empty theatre for a campaign with no ops', () => {
        expect(component.theatre({ id: 'unknown', name: 'X', summary: '', status: CampaignStatus.Current } as any)).toBe('');
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
