import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsOperationEditorComponent } from './operations-operation-editor.component';
import { CampaignsService } from '../../services/campaigns.service';
import { CampaignStatus, OperationStatus } from '../../models/campaign';

describe('OperationsOperationEditorComponent', () => {
    let component: OperationsOperationEditorComponent;
    let service: any;
    let router: any;

    function setup(params: Record<string, string>, campaignStatus = CampaignStatus.Current) {
        service = {
            addOperation: vi.fn().mockReturnValue(of(undefined)),
            updateOperation: vi.fn().mockReturnValue(of(undefined)),
            getCampaign: vi.fn().mockReturnValue(of({ id: params.campaignId ?? 'c1', name: 'Iron Sky', summary: '', status: campaignStatus })),
            getOperation: vi.fn().mockReturnValue(of({ id: 'op1', campaignId: 'c1', title: 'Alpha', brief: '<p>b</p>', status: OperationStatus.Past }))
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsOperationEditorComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries(params)) } } }
            ]
        });
        component = TestBed.inject(OperationsOperationEditorComponent);
    }

    afterEach(() => TestBed.resetTestingModule());

    it('create mode defaults to Upcoming and seeds campaignId', () => {
        setup({ campaignId: 'c1' });
        expect(component.model.status).toBe(OperationStatus.Upcoming);
        expect(component.model.campaignId).toBe('c1');
        expect(component.isEdit).toBe(false);
    });

    it('edit mode prefills from the operation', () => {
        setup({ campaignId: 'c1', operationId: 'op1' });
        expect(component.isEdit).toBe(true);
        expect(component.model.title).toBe('Alpha');
        expect(component.model.brief).toBe('<p>b</p>');
        expect(component.model.status).toBe(OperationStatus.Past);
    });

    it('submit (create) calls addOperation with Upcoming then navigates to the campaign', () => {
        setup({ campaignId: 'c1' });
        component.model.title = 'New';
        component.submit();
        expect(service.addOperation).toHaveBeenCalledWith('c1', expect.objectContaining({ status: OperationStatus.Upcoming, title: 'New' }));
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c1']);
    });

    it('submit (edit) calls updateOperation with the chosen status then navigates to the operation', () => {
        setup({ campaignId: 'c1', operationId: 'op1' });
        component.statusValue = component.statusOptions.find((o) => o.value === String(OperationStatus.Current));
        component.submit();
        expect(service.updateOperation).toHaveBeenCalledWith('c1', 'op1', expect.objectContaining({ status: OperationStatus.Current }));
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c1', 'operations', 'op1']);
    });

    it('submit does nothing without a title', () => {
        setup({ campaignId: 'c1' });
        component.submit();
        expect(service.addOperation).not.toHaveBeenCalled();
    });

    it('create under Past campaign redirects and does not write', () => {
        setup({ campaignId: 'c-past' }, CampaignStatus.Past);
        expect(component.creationBlocked).toBe(true);
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c-past']);
        component.model.title = 'Nope';
        component.submit();
        expect(service.addOperation).not.toHaveBeenCalled();
    });

    it('edit under Past campaign remains allowed', () => {
        setup({ campaignId: 'c-past', operationId: 'op1' }, CampaignStatus.Past);
        expect(component.creationBlocked).toBe(false);
        expect(component.isEdit).toBe(true);
        component.submit();
        expect(service.updateOperation).toHaveBeenCalled();
    });

    it('delayed campaign lookup blocks create until it completes', () => {
        const campaign$ = new Subject<any>();
        service = {
            addOperation: vi.fn().mockReturnValue(of(undefined)),
            updateOperation: vi.fn().mockReturnValue(of(undefined)),
            getCampaign: vi.fn().mockReturnValue(campaign$),
            getOperation: vi.fn().mockReturnValue(of(null))
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsOperationEditorComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries({ campaignId: 'c1' })) } } }
            ]
        });
        component = TestBed.inject(OperationsOperationEditorComponent);
        component.model.title = 'New';
        component.submit();
        expect(service.addOperation).not.toHaveBeenCalled();
        campaign$.next({ id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current });
        campaign$.complete();
        expect(component.ready).toBe(true);
        component.submit();
        expect(service.addOperation).toHaveBeenCalledWith('c1', expect.objectContaining({ title: 'New' }));
    });

    it('delayed Past campaign redirects without addOperation', () => {
        const campaign$ = new Subject<any>();
        service = {
            addOperation: vi.fn().mockReturnValue(of(undefined)),
            updateOperation: vi.fn().mockReturnValue(of(undefined)),
            getCampaign: vi.fn().mockReturnValue(campaign$),
            getOperation: vi.fn()
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsOperationEditorComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries({ campaignId: 'c-past' })) } } }
            ]
        });
        component = TestBed.inject(OperationsOperationEditorComponent);
        component.model.title = 'Nope';
        component.submit();
        expect(service.addOperation).not.toHaveBeenCalled();
        campaign$.next({ id: 'c-past', name: 'Old', summary: '', status: CampaignStatus.Past });
        campaign$.complete();
        expect(component.creationBlocked).toBe(true);
        expect(component.ready).toBe(false);
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c-past']);
        component.submit();
        expect(service.addOperation).not.toHaveBeenCalled();
    });

    it('delayed operation lookup blocks update until it completes', () => {
        const campaign$ = new Subject<any>();
        const operation$ = new Subject<any>();
        service = {
            addOperation: vi.fn().mockReturnValue(of(undefined)),
            updateOperation: vi.fn().mockReturnValue(of(undefined)),
            getCampaign: vi.fn().mockReturnValue(campaign$),
            getOperation: vi.fn().mockReturnValue(operation$)
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsOperationEditorComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries({ campaignId: 'c1', operationId: 'op1' })) } } }
            ]
        });
        component = TestBed.inject(OperationsOperationEditorComponent);
        component.model.title = 'Alpha';
        component.submit();
        expect(service.updateOperation).not.toHaveBeenCalled();
        campaign$.next({ id: 'c1', name: 'Iron Sky', summary: '', status: CampaignStatus.Current });
        campaign$.complete();
        component.submit();
        expect(service.updateOperation).not.toHaveBeenCalled();
        operation$.next({ id: 'op1', campaignId: 'c1', title: 'Alpha', brief: '<p>b</p>', status: OperationStatus.Past });
        operation$.complete();
        expect(component.ready).toBe(true);
        component.submit();
        expect(service.updateOperation).toHaveBeenCalledWith('c1', 'op1', expect.objectContaining({ title: 'Alpha' }));
    });

    it('campaign load error keeps create blocked', () => {
        service = {
            addOperation: vi.fn().mockReturnValue(of(undefined)),
            updateOperation: vi.fn().mockReturnValue(of(undefined)),
            getCampaign: vi.fn().mockReturnValue(throwError(() => ({ status: 404 }))),
            getOperation: vi.fn()
        };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsOperationEditorComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries({ campaignId: 'c1' })) } } }
            ]
        });
        component = TestBed.inject(OperationsOperationEditorComponent);
        expect(component.ready).toBe(false);
        component.model.title = 'New';
        component.submit();
        expect(service.addOperation).not.toHaveBeenCalled();
    });
});
