import { afterEach, describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsIntelEditorComponent } from './operations-intel-editor.component';
import { CampaignsService } from '../../services/campaigns.service';
import { CampaignStatus, IntelScope } from '../../models/campaign';

describe('OperationsIntelEditorComponent', () => {
    let component: OperationsIntelEditorComponent;
    let service: any;
    let router: any;

    function setup(params: Record<string, string>, pages: any[] = [], errors: { campaign?: boolean; operation?: boolean; past?: boolean } = {}) {
        service = {
            addIntel: vi.fn().mockReturnValue(of(undefined)),
            updateIntel: vi.fn().mockReturnValue(of(undefined)),
            getCampaign: vi.fn().mockReturnValue(
                errors.campaign ? throwError(() => ({ status: 404 })) : of({ id: params.campaignId ?? 'c1', name: 'Iron Sky', summary: '', status: errors.past ? CampaignStatus.Past : CampaignStatus.Current })
            ),
            getOperation: vi.fn().mockReturnValue(errors.operation ? throwError(() => ({ status: 404 })) : of({ id: 'op1' })),
            getMission: vi.fn().mockReturnValue(of({ mission: { id: 'm1', title: 'Sweep' } })),
            getIntel: vi.fn().mockReturnValue(of(pages))
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsIntelEditorComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries(params)) } } }
            ]
        });
        component = TestBed.inject(OperationsIntelEditorComponent);
    }

    afterEach(() => TestBed.resetTestingModule());

    it('create mode seeds campaign scope + ownerId', () => {
        setup({ campaignId: 'c1' });
        expect(component.model.scope).toBe(IntelScope.Campaign);
        expect(component.model.ownerId).toBe('c1');
        expect(component.isEdit).toBe(false);
    });

    it('create mode seeds operation scope + ownerId', () => {
        setup({ campaignId: 'c1', operationId: 'op1' });
        expect(component.model.scope).toBe(IntelScope.Operation);
        expect(component.model.ownerId).toBe('op1');
    });

    it('create mode seeds mission scope + ownerId', () => {
        setup({ campaignId: 'c1', operationId: 'op1', missionId: 'm1' });
        expect(component.model.scope).toBe(IntelScope.Mission);
        expect(component.model.ownerId).toBe('m1');
    });

    it('submit create calls addIntel then navigates to the owner', () => {
        setup({ campaignId: 'c1' });
        component.model.title = 'Enemy';
        component.submit();
        expect(service.addIntel).toHaveBeenCalledWith(expect.objectContaining({ scope: IntelScope.Campaign, ownerId: 'c1' }));
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c1']);
    });

    it('edit mode prefills from page data', () => {
        setup({ campaignId: 'c1', operationId: 'op1', missionId: 'm1', intelId: 'i1' }, [{ id: 'i1', scope: IntelScope.Mission, ownerId: 'm1', title: 'Recon', body: '' }]);
        expect(component.isEdit).toBe(true);
        expect(component.model.title).toBe('Recon');
    });

    it('submit edit calls updateIntel then navigates to the intel page', () => {
        setup({ campaignId: 'c1', operationId: 'op1', missionId: 'm1', intelId: 'i1' }, [{ id: 'i1', scope: IntelScope.Mission, ownerId: 'm1', title: 'Recon', body: '' }]);
        component.submit();
        expect(service.updateIntel).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1' }));
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c1', 'operations', 'op1', 'missions', 'm1', 'intel', 'i1']);
    });

    it('marks missing when the intel is not on the owner', () => {
        setup({ campaignId: 'c1', intelId: 'missing' }, [{ id: 'i1', scope: IntelScope.Campaign, ownerId: 'c1', title: 'Other', body: '' }]);
        expect(component.missing).toBe(true);
    });

    it('marks missing when an ancestor request fails', () => {
        setup({ campaignId: 'c2', operationId: 'op1', intelId: 'i2' }, [], { operation: true });
        expect(component.missing).toBe(true);
        expect(service.getIntel).not.toHaveBeenCalled();
    });

    it.each([
        [{ campaignId: 'c-past' }, ['/operations/campaigns', 'c-past']],
        [{ campaignId: 'c-past', operationId: 'op-past' }, ['/operations/campaigns', 'c-past', 'operations', 'op-past']],
        [{ campaignId: 'c-past', operationId: 'op-past', missionId: 'm-past' }, ['/operations/campaigns', 'c-past', 'operations', 'op-past', 'missions', 'm-past']]
    ] as const)('create under Past campaign redirects and does not write %j', (params, back) => {
        setup({ ...params }, [], { past: true });
        expect(component.creationBlocked).toBe(true);
        expect(router.navigate).toHaveBeenCalledWith([...back]);
        component.model.title = 'Nope';
        component.submit();
        expect(service.addIntel).not.toHaveBeenCalled();
    });

    it('edit under Past campaign remains allowed', () => {
        setup({ campaignId: 'c-past', intelId: 'i1' }, [{ id: 'i1', scope: IntelScope.Campaign, ownerId: 'c-past', title: 'Old', body: '' }], { past: true });
        expect(component.creationBlocked).toBe(false);
        component.submit();
        expect(service.updateIntel).toHaveBeenCalled();
    });

    it('delayed ancestry blocks create until all parents complete', () => {
        const campaign$ = new Subject<any>();
        const operation$ = new Subject<any>();
        service = {
            addIntel: vi.fn().mockReturnValue(of(undefined)),
            updateIntel: vi.fn().mockReturnValue(of(undefined)),
            getCampaign: vi.fn().mockReturnValue(campaign$),
            getOperation: vi.fn().mockReturnValue(operation$),
            getMission: vi.fn().mockReturnValue(of(null)),
            getIntel: vi.fn()
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsIntelEditorComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries({ campaignId: 'c1', operationId: 'op1' })) } } }
            ]
        });
        component = TestBed.inject(OperationsIntelEditorComponent);
        component.model.title = 'Enemy';
        component.submit();
        expect(service.addIntel).not.toHaveBeenCalled();
        campaign$.next({ id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current });
        campaign$.complete();
        component.submit();
        expect(service.addIntel).not.toHaveBeenCalled();
        operation$.next({ id: 'op1' });
        operation$.complete();
        expect(component.ready).toBe(true);
        component.submit();
        expect(service.addIntel).toHaveBeenCalledWith(expect.objectContaining({ scope: IntelScope.Operation, ownerId: 'op1', title: 'Enemy' }));
    });

    it('delayed Past campaign redirects without addIntel', () => {
        const campaign$ = new Subject<any>();
        service = {
            addIntel: vi.fn().mockReturnValue(of(undefined)),
            updateIntel: vi.fn().mockReturnValue(of(undefined)),
            getCampaign: vi.fn().mockReturnValue(campaign$),
            getOperation: vi.fn().mockReturnValue(of(null)),
            getMission: vi.fn().mockReturnValue(of(null)),
            getIntel: vi.fn()
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsIntelEditorComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries({ campaignId: 'c-past' })) } } }
            ]
        });
        component = TestBed.inject(OperationsIntelEditorComponent);
        component.model.title = 'Nope';
        component.submit();
        expect(service.addIntel).not.toHaveBeenCalled();
        campaign$.next({ id: 'c-past', name: 'Old', summary: '', status: CampaignStatus.Past });
        campaign$.complete();
        expect(component.creationBlocked).toBe(true);
        expect(component.ready).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c-past']);
        component.submit();
        expect(service.addIntel).not.toHaveBeenCalled();
    });

    it('delayed intel lookup blocks update until it completes', () => {
        const intel$ = new Subject<any[]>();
        service = {
            addIntel: vi.fn().mockReturnValue(of(undefined)),
            updateIntel: vi.fn().mockReturnValue(of(undefined)),
            getCampaign: vi.fn().mockReturnValue(of({ id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current })),
            getOperation: vi.fn().mockReturnValue(of(null)),
            getMission: vi.fn().mockReturnValue(of(null)),
            getIntel: vi.fn().mockReturnValue(intel$)
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsIntelEditorComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries({ campaignId: 'c1', intelId: 'i1' })) } } }
            ]
        });
        component = TestBed.inject(OperationsIntelEditorComponent);
        component.model.title = 'Recon';
        component.submit();
        expect(service.updateIntel).not.toHaveBeenCalled();
        intel$.next([{ id: 'i1', scope: IntelScope.Campaign, ownerId: 'c1', title: 'Recon', body: '' }]);
        intel$.complete();
        expect(component.ready).toBe(true);
        component.submit();
        expect(service.updateIntel).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1', title: 'Recon' }));
    });

    it('ancestry error keeps create blocked', () => {
        setup({ campaignId: 'c1', operationId: 'op1' }, [], { operation: true });
        expect(component.ready).toBe(false);
        component.model.title = 'Enemy';
        component.submit();
        expect(service.addIntel).not.toHaveBeenCalled();
    });
});
