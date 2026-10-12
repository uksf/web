import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { OperationsCampaignsComponent } from './operations-campaigns.component';
import { CampaignsService } from '../../services/campaigns.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { CampaignStatus, MissionFileState } from '../../models/campaign';

describe('OperationsCampaignsComponent', () => {
    let component: OperationsCampaignsComponent;
    let service: any;
    let router: any;

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
        service = {
            getCampaigns: vi.fn().mockReturnValue(of(campaigns)),
            getCampaignMissions: vi.fn().mockImplementation((id: string) => of(missionsByCampaign[id] ?? []))
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsCampaignsComponent,
                { provide: CampaignsService, useValue: service },
                { provide: PermissionsService, useValue: { hasPermission: vi.fn().mockReturnValue(true) } },
                { provide: Router, useValue: router }
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

    it('orders campaigns in a section by start date, newest first for past, undated last', () => {
        service.getCampaigns.mockReturnValue(
            of([
                { id: 'u1', name: 'Undated', summary: '', status: CampaignStatus.Upcoming },
                { id: 'u2', name: 'Later', summary: '', status: CampaignStatus.Upcoming, start: '2026-12-01T00:00:00Z' },
                { id: 'u3', name: 'Sooner', summary: '', status: CampaignStatus.Upcoming, start: '2026-11-01T00:00:00Z' },
                { id: 'p1', name: 'Older', summary: '', status: CampaignStatus.Past, start: '2025-01-01T00:00:00Z' },
                { id: 'p2', name: 'Undated past', summary: '', status: CampaignStatus.Past },
                { id: 'p3', name: 'Recent', summary: '', status: CampaignStatus.Past, start: '2026-01-01T00:00:00Z' }
            ])
        );
        component.load();
        expect(component.sections.find((s) => s.title === 'Upcoming')?.items.map((c) => c.name)).toEqual(['Sooner', 'Later', 'Undated']);
        expect(component.sections.find((s) => s.title === 'Past')?.items.map((c) => c.name)).toEqual(['Recent', 'Older', 'Undated past']);
    });

    it('omits sections that have no campaigns', () => {
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

    it('createCampaign navigates to the campaign editor', () => {
        component.createCampaign();
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns/new']);
    });
});
