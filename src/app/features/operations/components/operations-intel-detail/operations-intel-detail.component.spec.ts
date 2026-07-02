import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsIntelDetailComponent } from './operations-intel-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { CampaignStatus, IntelScope, OpStatus } from '../../models/campaign';

describe('OperationsIntelDetailComponent', () => {
    let service: any;
    let router: any;

    const campaign = { id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current };
    const opDto = { op: { id: 'op1', campaignId: 'c1', title: 'Op 1', scheduledTime: '2026-06-28T18:00:00Z', serverId: 's1', missionName: 'm', warno: '', status: OpStatus.Scheduled } };
    const campaignIntelPage = { id: 'i1', scope: IntelScope.Campaign, ownerId: 'c1', title: 'Briefing', body: '<p>b</p>' };
    const opIntelPage = { id: 'i2', scope: IntelScope.Op, ownerId: 'op1', title: 'Op briefing', body: '<p>b</p>' };

    function configure(paramMap: Record<string, string | null>) {
        service = {
            getCampaign: vi.fn().mockReturnValue(of(campaign)),
            getOp: vi.fn().mockReturnValue(of(opDto)),
            getIntel: vi.fn().mockReturnValue(of([campaignIntelPage, opIntelPage])),
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

    describe('campaign-scoped intel (no opId in route)', () => {
        beforeEach(() => configure({ id: 'c1', intelId: 'i1' }));

        it('loads the campaign, campaign-scoped intel, and does not load an op', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(service.getCampaign).toHaveBeenCalledWith('c1');
            expect(service.getIntel).toHaveBeenCalledWith(IntelScope.Campaign, 'c1');
            expect(service.getOp).not.toHaveBeenCalled();
            expect(component.page?.title).toBe('Briefing');
        });

        it('backLink points at the campaign', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(component.backLink).toEqual(['/operations/campaigns', 'c1']);
            expect(component.backLabel).toBe('Iron Sky');
        });
    });

    describe('op-scoped intel (opId present in route)', () => {
        beforeEach(() => configure({ id: 'c1', opId: 'op1', intelId: 'i2' }));

        it('loads the op and op-scoped intel', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(service.getOp).toHaveBeenCalledWith('op1');
            expect(service.getIntel).toHaveBeenCalledWith(IntelScope.Op, 'op1');
            expect(component.page?.title).toBe('Op briefing');
        });

        it('backLink points at the op', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            expect(component.backLink).toEqual(['/operations/campaigns', 'c1', 'ops', 'op1']);
            expect(component.backLabel).toBe('Op 1');
        });
    });

    describe('delete', () => {
        beforeEach(() => configure({ id: 'c1', intelId: 'i1' }));

        it('deletes the page and navigates back after confirmation', () => {
            const component = TestBed.inject(OperationsIntelDetailComponent);

            component.delete();

            expect(service.deleteIntel).toHaveBeenCalledWith('i1');
            expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c1']);
        });
    });
});
