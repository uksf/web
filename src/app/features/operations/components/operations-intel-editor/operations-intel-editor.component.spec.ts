import { afterEach, describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsIntelEditorComponent } from './operations-intel-editor.component';
import { CampaignsService } from '../../services/campaigns.service';
import { IntelScope } from '../../models/campaign';

describe('OperationsIntelEditorComponent', () => {
    let component: OperationsIntelEditorComponent;
    let service: any;
    let router: any;

    function setup(params: Record<string, string>, pages: any[] = [], errors: { campaign?: boolean; operation?: boolean } = {}) {
        service = {
            addIntel: vi.fn().mockReturnValue(of(undefined)),
            updateIntel: vi.fn().mockReturnValue(of(undefined)),
            getCampaign: vi.fn().mockReturnValue(errors.campaign ? throwError(() => ({ status: 404 })) : of({ id: 'c1' })),
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
});
