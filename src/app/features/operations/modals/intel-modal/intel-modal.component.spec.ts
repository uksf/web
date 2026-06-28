import { afterEach, describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IntelModalComponent } from './intel-modal.component';
import { CampaignsService } from '../../services/campaigns.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IntelScope } from '../../models/campaign';

describe('IntelModalComponent', () => {
    let component: IntelModalComponent;
    let service: any;
    let dialogRef: any;

    function setup(data: any) {
        service = { addIntel: vi.fn().mockReturnValue(of(undefined)), updateIntel: vi.fn().mockReturnValue(of(undefined)) };
        dialogRef = { close: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                IntelModalComponent,
                { provide: CampaignsService, useValue: service },
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MatDialog, useValue: { open: vi.fn() } },
                { provide: MAT_DIALOG_DATA, useValue: data }
            ]
        });
        component = TestBed.inject(IntelModalComponent);
    }

    afterEach(() => TestBed.resetTestingModule());

    it('create mode seeds scope + ownerId', () => {
        setup({ scope: IntelScope.Op, ownerId: 'op1' });
        expect(component.model.scope).toBe(IntelScope.Op);
        expect(component.model.ownerId).toBe('op1');
        expect(component.isEdit).toBe(false);
    });

    it('submit create calls addIntel then closes true', () => {
        setup({ scope: IntelScope.Campaign, ownerId: 'c1' });
        component.model.title = 'Enemy';
        component.submit();
        expect(service.addIntel).toHaveBeenCalledWith(expect.objectContaining({ scope: IntelScope.Campaign, ownerId: 'c1' }));
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('edit mode prefills from page data', () => {
        setup({ scope: IntelScope.Op, ownerId: 'op1', page: { id: 'i1', scope: IntelScope.Op, ownerId: 'op1', title: 'Recon', body: '' } });
        expect(component.isEdit).toBe(true);
        expect(component.model.title).toBe('Recon');
    });

    it('submit edit calls updateIntel then closes true', () => {
        setup({ scope: IntelScope.Op, ownerId: 'op1', page: { id: 'i1', scope: IntelScope.Op, ownerId: 'op1', title: 'Recon', body: '' } });
        component.submit();
        expect(service.updateIntel).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1' }));
        expect(dialogRef.close).toHaveBeenCalledWith(true);
    });
});
