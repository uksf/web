import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsIntelDetailComponent } from './operations-intel-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { CampaignMissionStatus, CampaignStatus, IntelScope, OperationStatus } from '../../models/campaign';

describe('OperationsIntelDetailComponent', () => {
    let service: any;
    let router: any;

    const campaign = { id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current };
    const operation = { id: 'op1', campaignId: 'c1', title: 'Alpha', brief: '', status: OperationStatus.Current };
    const missionDto = { mission: { id: 'm1', operationId: 'op1', title: 'Sweep', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'm', warno: '', status: CampaignMissionStatus.Scheduled } };
    const campaignIntelPage = { id: 'i1', scope: IntelScope.Campaign, ownerId: 'c1', title: 'Briefing', body: '<p>b</p>' };
    const operationIntelPage = { id: 'i2', scope: IntelScope.Operation, ownerId: 'op1', title: 'Op briefing', body: '<p>b</p>' };
    const missionIntelPage = { id: 'i3', scope: IntelScope.Mission, ownerId: 'm1', title: 'Mission briefing', body: '<p>b</p>' };

    function configure(
        paramMap: Record<string, string | null>,
        pages: any[] = [campaignIntelPage, operationIntelPage, missionIntelPage],
        errors: { campaign?: boolean; operation?: boolean; mission?: boolean } = {}
    ) {
        service = {
            getCampaign: vi.fn().mockReturnValue(errors.campaign ? throwError(() => ({ status: 404 })) : of(campaign)),
            getOperation: vi.fn().mockReturnValue(errors.operation ? throwError(() => ({ status: 404 })) : of(operation)),
            getMission: vi.fn().mockReturnValue(errors.mission ? throwError(() => ({ status: 404 })) : of(missionDto)),
            getIntel: vi.fn().mockReturnValue(of(pages)),
            deleteIntel: vi.fn().mockReturnValue(of(undefined))
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsIntelDetailComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn().mockReturnValue({ afterClosed: () => of(true) }) } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries(paramMap)) } } }
            ]
        });
    }

    afterEach(() => TestBed.resetTestingModule());

    describe('campaign-scoped intel (no operationId in route)', () => {
        beforeEach(() => configure({ campaignId: 'c1', intelId: 'i1' }));

        it('loads the campaign, campaign-scoped intel, and does not load an operation', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(service.getCampaign).toHaveBeenCalledWith('c1');
            expect(service.getIntel).toHaveBeenCalledWith(IntelScope.Campaign, 'c1');
            expect(service.getOperation).not.toHaveBeenCalled();
            expect(service.getMission).not.toHaveBeenCalled();
            expect(component.page?.title).toBe('Briefing');
            expect(component.ancestry).toBe('Iron Sky');
            expect(component.missing).toBe(false);
        });

        it('backLink points at the campaign', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(component.backLink).toEqual(['/operations/campaigns', 'c1']);
            expect(component.backLabel).toBe('Iron Sky');
        });
    });

    describe('operation-scoped intel (operationId present in route)', () => {
        beforeEach(() => configure({ campaignId: 'c1', operationId: 'op1', intelId: 'i2' }));

        it('loads the operation and operation-scoped intel', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(service.getOperation).toHaveBeenCalledWith('c1', 'op1');
            expect(service.getIntel).toHaveBeenCalledWith(IntelScope.Operation, 'op1');
            expect(service.getMission).not.toHaveBeenCalled();
            expect(component.page?.title).toBe('Op briefing');
            expect(component.ancestry).toBe('Iron Sky / Alpha');
        });

        it('backLink points at the operation', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(component.backLink).toEqual(['/operations/campaigns', 'c1', 'operations', 'op1']);
            expect(component.backLabel).toBe('Alpha');
        });
    });

    describe('mission-scoped intel (missionId present in route)', () => {
        beforeEach(() => configure({ campaignId: 'c1', operationId: 'op1', missionId: 'm1', intelId: 'i3' }));

        it('loads the mission and mission-scoped intel', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(service.getMission).toHaveBeenCalledWith('c1', 'op1', 'm1');
            expect(service.getIntel).toHaveBeenCalledWith(IntelScope.Mission, 'm1');
            expect(component.page?.title).toBe('Mission briefing');
            expect(component.ancestry).toBe('Iron Sky / Alpha / Sweep');
        });

        it('backLink points at the mission', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(component.backLink).toEqual(['/operations/campaigns', 'c1', 'operations', 'op1', 'missions', 'm1']);
            expect(component.backLabel).toBe('Sweep');
        });
    });

    describe('missing intel', () => {
        beforeEach(() => configure({ campaignId: 'c1', intelId: 'missing' }, [campaignIntelPage]));

        it('marks loaded and leaves page undefined when the id is not in the owner list', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(component.loaded).toBe(true);
            expect(component.missing).toBe(false);
            expect(component.page).toBeUndefined();
        });
    });

    describe('ancestor failures', () => {
        it('does not render intel when the campaign request fails', () => {
            configure({ campaignId: 'c-missing', intelId: 'i1' }, [campaignIntelPage], { campaign: true });
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(service.getIntel).not.toHaveBeenCalled();
            expect(component.page).toBeUndefined();
            expect(component.missing).toBe(true);
            expect(component.loaded).toBe(true);
        });

        it('does not render intel when the operation belongs to a different campaign', () => {
            configure({ campaignId: 'c2', operationId: 'op1', intelId: 'i2' }, [operationIntelPage], { operation: true });
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(service.getOperation).toHaveBeenCalledWith('c2', 'op1');
            expect(service.getIntel).not.toHaveBeenCalled();
            expect(component.page).toBeUndefined();
            expect(component.missing).toBe(true);
        });

        it('does not render intel when a parent mission is missing', () => {
            configure({ campaignId: 'c1', operationId: 'op1', missionId: 'm-missing', intelId: 'i3' }, [missionIntelPage], { mission: true });
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(service.getMission).toHaveBeenCalledWith('c1', 'op1', 'm-missing');
            expect(service.getIntel).not.toHaveBeenCalled();
            expect(component.page).toBeUndefined();
            expect(component.missing).toBe(true);
        });
    });

    describe('delete', () => {
        beforeEach(() => configure({ campaignId: 'c1', intelId: 'i1' }));

        it('deletes the page and navigates back after confirmation', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            component.delete();

            expect(service.deleteIntel).toHaveBeenCalledWith('i1');
            expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c1']);
        });
    });
});
