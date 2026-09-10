import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsCampaignDetailComponent } from './operations-campaign-detail.component';
import { CampaignsService } from '../../services/campaigns.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { ActivatedRoute } from '@angular/router';
import { CampaignStatus, IntelScope, OperationStatus } from '../../models/campaign';

describe('OperationsCampaignDetailComponent', () => {
    let component: OperationsCampaignDetailComponent;
    let service: any;
    let dialog: any;
    let router: any;
    let dialogAfterClosed$: Subject<any>;

    const campaign = { id: 'c1', name: 'Iron Sky', summary: '<p>b</p>', status: CampaignStatus.Current };
    const operation = { id: 'op1', campaignId: 'c1', title: 'Op 1', brief: '<p>brief</p>', status: OperationStatus.Upcoming };
    const siblingOperation = { id: 'op2', campaignId: 'c1', title: 'Op 2', brief: '', status: OperationStatus.Current };
    const intelPage = { id: 'i1', scope: IntelScope.Campaign, ownerId: 'c1', title: 'Enemy', body: '' };

    beforeEach(() => {
        dialogAfterClosed$ = new Subject();
        service = {
            getCampaign: vi.fn().mockReturnValue(of(campaign)),
            getOperations: vi.fn().mockReturnValue(of([operation, siblingOperation])),
            getIntel: vi.fn().mockReturnValue(of([intelPage])),
            deleteCampaign: vi.fn().mockReturnValue(of(undefined)),
            deleteOperation: vi.fn().mockReturnValue(of(undefined)),
            deleteIntel: vi.fn().mockReturnValue(of(undefined))
        };
        dialog = { open: vi.fn().mockReturnValue({ afterClosed: () => dialogAfterClosed$.asObservable() }) };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsCampaignDetailComponent,
                { provide: CampaignsService, useValue: service },
                { provide: PermissionsService, useValue: { hasPermission: vi.fn().mockReturnValue(true) } },
                { provide: MatDialog, useValue: dialog },
                { provide: Router, useValue: router },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['campaignId', 'c1']]) } } }
            ]
        });
        component = TestBed.inject(OperationsCampaignDetailComponent);
    });

    afterEach(() => TestBed.resetTestingModule());

    it('loads campaign, operations and intel for the route campaignId', () => {
        expect(service.getCampaign).toHaveBeenCalledWith('c1');
        expect(service.getOperations).toHaveBeenCalledWith('c1');
        expect(service.getIntel).toHaveBeenCalledWith(IntelScope.Campaign, 'c1');
        expect(component.campaign?.name).toBe('Iron Sky');
        expect(component.operations.length).toBe(2);
        expect(component.intel.length).toBe(1);
    });

    it('exposes OperationStatus + CampaignStatus enums to the template', () => {
        expect(component.OperationStatus.Current).toBe(OperationStatus.Current);
        expect(component.CampaignStatus.Upcoming).toBe(CampaignStatus.Upcoming);
    });

    it.each([
        [CampaignStatus.Current, 'Current'],
        [CampaignStatus.Upcoming, 'Upcoming'],
        [CampaignStatus.Past, 'Past']
    ])('statusLabel maps %s to %s', (status, label) => {
        component.campaign = { ...campaign, status };
        expect(component.statusLabel).toBe(label);
    });

    it.each([
        [OperationStatus.Upcoming, 'Upcoming'],
        [OperationStatus.Current, 'Current'],
        [OperationStatus.Past, 'Past']
    ])('operationStatusLabel maps %s to %s', (status, label) => {
        expect(component.operationStatusLabel({ ...operation, status })).toBe(label);
    });

    it('createIntel opens modal with Campaign scope and campaignId', () => {
        component.createIntel();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: expect.objectContaining({ scope: IntelScope.Campaign, ownerId: 'c1' }) }));
    });

    it('createOperation opens modal seeded with the campaignId', () => {
        component.createOperation();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { campaignId: 'c1' } }));
    });

    it('editCampaign opens modal with the current campaign', () => {
        component.editCampaign();
        expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ data: { campaign: component.campaign } }));
    });

    it('openOperation navigates to the operation detail route', () => {
        component.openOperation(operation as any);
        expect(router.navigate).toHaveBeenCalledWith(['operations', 'op1'], expect.anything());
    });

    it('openIntel navigates to the intel detail route', () => {
        component.openIntel(intelPage as any);
        expect(router.navigate).toHaveBeenCalledWith(['intel', 'i1'], expect.anything());
    });

    it('deleteCampaign deletes then navigates to the list when confirmed', () => {
        component.deleteCampaign();
        dialogAfterClosed$.next(true);
        expect(service.deleteCampaign).toHaveBeenCalledWith('c1');
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns']);
    });

    it('deleteCampaign does nothing when the confirmation is dismissed', () => {
        component.deleteCampaign();
        dialogAfterClosed$.next(false);
        expect(service.deleteCampaign).not.toHaveBeenCalled();
    });

    it('deleteOperation deletes the named operation then reloads when confirmed', () => {
        service.getOperations.mockClear();
        component.deleteOperation(operation as any);
        dialogAfterClosed$.next(true);
        expect(service.deleteOperation).toHaveBeenCalledWith('c1', 'op1');
        expect(service.deleteOperation).not.toHaveBeenCalledWith('c1', 'op2');
        expect(service.getOperations).toHaveBeenCalled();
    });

    it('deleteIntel deletes then reloads when confirmed', () => {
        service.getIntel.mockClear();
        component.deleteIntel(intelPage as any);
        dialogAfterClosed$.next(true);
        expect(service.deleteIntel).toHaveBeenCalledWith('i1');
        expect(service.getIntel).toHaveBeenCalled();
    });

    it.each([OperationStatus.Upcoming, OperationStatus.Current, OperationStatus.Past])(
        'Past campaign gates create/delete/add-intel regardless of operation status %s',
        (status) => {
            component.campaign = { ...campaign, status: CampaignStatus.Past };
            component.operations = [{ ...operation, status }];
            expect(component.isPastCampaign).toBe(true);
        }
    );

    it.each([OperationStatus.Upcoming, OperationStatus.Current, OperationStatus.Past])(
        'Current campaign does not freeze create/delete/add-intel when operation is %s',
        (status) => {
            component.campaign = { ...campaign, status: CampaignStatus.Current };
            component.operations = [{ ...operation, status }];
            expect(component.isPastCampaign).toBe(false);
        }
    );
});
