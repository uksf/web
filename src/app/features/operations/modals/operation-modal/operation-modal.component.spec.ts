import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OperationModalComponent } from './operation-modal.component';
import { CampaignsService } from '../../services/campaigns.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OperationStatus } from '../../models/campaign';

describe('OperationModalComponent', () => {
    let component: OperationModalComponent;
    let service: any;
    let dialogRef: any;

    function setup(data: any) {
        service = { addOperation: vi.fn().mockReturnValue(of(undefined)), updateOperation: vi.fn().mockReturnValue(of(undefined)) };
        dialogRef = { close: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                OperationModalComponent,
                { provide: CampaignsService, useValue: service },
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        });
        component = TestBed.inject(OperationModalComponent);
    }

    afterEach(() => TestBed.resetTestingModule());

    it('create mode defaults to Upcoming and seeds campaignId', () => {
        setup({ campaignId: 'c1' });
        expect(component.model.status).toBe(OperationStatus.Upcoming);
        expect(component.model.campaignId).toBe('c1');
        expect(component.isEdit).toBe(false);
    });

    it('edit mode prefills from data', () => {
        setup({ campaignId: 'c1', operation: { id: 'op1', campaignId: 'c1', title: 'Alpha', brief: '<p>b</p>', status: OperationStatus.Past } });
        expect(component.isEdit).toBe(true);
        expect(component.model.title).toBe('Alpha');
        expect(component.model.brief).toBe('<p>b</p>');
        expect(component.model.status).toBe(OperationStatus.Past);
    });

    it('submit (create) calls addOperation with Upcoming status then closes true', () => {
        setup({ campaignId: 'c1' });
        component.model.title = 'New';
        component.submit();
        expect(service.addOperation).toHaveBeenCalledWith('c1', expect.objectContaining({ status: OperationStatus.Upcoming, title: 'New' }));
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('submit (edit) calls updateOperation with the chosen status', () => {
        setup({ campaignId: 'c1', operation: { id: 'op1', campaignId: 'c1', title: 'Alpha', brief: '', status: OperationStatus.Upcoming } });
        component.statusValue = component.statusOptions.find((o) => o.value === String(OperationStatus.Current));
        component.submit();
        expect(service.updateOperation).toHaveBeenCalledWith('c1', 'op1', expect.objectContaining({ status: OperationStatus.Current }));
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('submit does nothing without a title', () => {
        setup({ campaignId: 'c1' });
        component.submit();
        expect(service.addOperation).not.toHaveBeenCalled();
    });
});
