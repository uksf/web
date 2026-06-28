import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CampaignModalComponent } from './campaign-modal.component';
import { CampaignsService } from '../../services/campaigns.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignStatus } from '../../models/campaign';

describe('CampaignModalComponent', () => {
    let component: CampaignModalComponent;
    let service: any;
    let dialogRef: any;

    function setup(data: any) {
        service = { addCampaign: vi.fn().mockReturnValue(of(undefined)), updateCampaign: vi.fn().mockReturnValue(of(undefined)) };
        dialogRef = { close: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                CampaignModalComponent,
                { provide: CampaignsService, useValue: service },
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        });
        component = TestBed.inject(CampaignModalComponent);
    }

    afterEach(() => TestBed.resetTestingModule());

    it('create mode defaults to Active', () => {
        setup(null);
        expect(component.model.status).toBe(CampaignStatus.Active);
        expect(component.isEdit).toBe(false);
    });

    it('edit mode prefills from data', () => {
        setup({ campaign: { id: 'c1', name: 'Iron Sky', brief: '<p>b</p>', status: CampaignStatus.Archived, theatre: 'takistan' } });
        expect(component.isEdit).toBe(true);
        expect(component.model.name).toBe('Iron Sky');
        expect(component.model.status).toBe(CampaignStatus.Archived);
    });

    it('submit (create) calls addCampaign with Active status then closes true', () => {
        setup(null);
        component.model.name = 'New';
        component.submit();
        expect(service.addCampaign).toHaveBeenCalledWith(expect.objectContaining({ status: CampaignStatus.Active }));
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('submit (edit) calls updateCampaign with Archived status', () => {
        setup({ campaign: { id: 'c1', name: 'Iron Sky', brief: '', status: CampaignStatus.Active } });
        component.statusValue = component.statusOptions.find((o) => o.value === String(CampaignStatus.Archived));
        component.submit();
        expect(service.updateCampaign).toHaveBeenCalledWith(expect.objectContaining({ status: CampaignStatus.Archived }));
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });
});
