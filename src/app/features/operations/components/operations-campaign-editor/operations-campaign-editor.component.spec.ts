import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { OperationsCampaignEditorComponent } from './operations-campaign-editor.component';
import { CampaignsService } from '../../services/campaigns.service';
import { CampaignStatus } from '../../models/campaign';

describe('OperationsCampaignEditorComponent', () => {
    let component: OperationsCampaignEditorComponent;
    let service: any;
    let router: any;

    function setup(params: Record<string, string>) {
        service = { addCampaign: vi.fn().mockReturnValue(of(undefined)), updateCampaign: vi.fn().mockReturnValue(of(undefined)), getCampaign: vi.fn().mockReturnValue(of({ id: 'c1', name: 'Iron Sky', summary: '<p>b</p>', status: CampaignStatus.Past })) };
        router = { navigate: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationsCampaignEditorComponent,
                { provide: CampaignsService, useValue: service },
                { provide: Router, useValue: router },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map(Object.entries(params)) } } }
            ]
        });
        component = TestBed.inject(OperationsCampaignEditorComponent);
    }

    afterEach(() => TestBed.resetTestingModule());

    it('create mode defaults to Upcoming', () => {
        setup({});
        expect(component.model.status).toBe(CampaignStatus.Upcoming);
        expect(component.isEdit).toBe(false);
        expect(component.model).toHaveProperty('summary');
    });

    it('edit mode prefills from the campaign', () => {
        setup({ campaignId: 'c1' });
        expect(component.isEdit).toBe(true);
        expect(component.model.name).toBe('Iron Sky');
        expect(component.model.status).toBe(CampaignStatus.Past);
    });

    it('submit (create) calls addCampaign with Upcoming then navigates to the list', () => {
        setup({});
        component.model.name = 'New';
        component.submit();
        expect(service.addCampaign).toHaveBeenCalledWith(expect.objectContaining({ status: CampaignStatus.Upcoming }));
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns']);
    });

    it('submit (edit) calls updateCampaign with the chosen status then navigates to the campaign', () => {
        setup({ campaignId: 'c1' });
        component.statusValue = component.statusOptions.find((o) => o.value === String(CampaignStatus.Current));
        component.submit();
        expect(service.updateCampaign).toHaveBeenCalledWith(expect.objectContaining({ status: CampaignStatus.Current }));
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns', 'c1']);
    });

    it('cancel from create returns to the list without saving', () => {
        setup({});
        component.cancel();
        expect(service.addCampaign).not.toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/operations/campaigns']);
    });
});
