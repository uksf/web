import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OperationsCampaignsComponent } from './operations-campaigns.component';
import { CampaignsService } from '../../services/campaigns.service';
import { PermissionsService } from '@app/core/services/permissions.service';
import { MatDialog } from '@angular/material/dialog';
import { CampaignStatus } from '../../models/campaign';

describe('OperationsCampaignsComponent', () => {
    let component: OperationsCampaignsComponent;
    let service: any;

    beforeEach(() => {
        service = {
            getCampaigns: vi.fn().mockReturnValue(
                of([{ id: 'c1', name: 'Iron Sky', brief: '', status: CampaignStatus.Active, theatre: 'takistan' }])
            )
        };
        TestBed.configureTestingModule({
            providers: [
                OperationsCampaignsComponent,
                { provide: CampaignsService, useValue: service },
                { provide: PermissionsService, useValue: { hasPermission: vi.fn().mockReturnValue(true) } },
                { provide: MatDialog, useValue: { open: vi.fn() } }
            ]
        });
        component = TestBed.inject(OperationsCampaignsComponent);
    });

    it('loads campaigns on construction', () => {
        expect(service.getCampaigns).toHaveBeenCalled();
        expect(component.campaigns.length).toBe(1);
        expect(component.campaigns[0].name).toBe('Iron Sky');
    });

    it('summary shows status', () => {
        expect(component.summary(component.campaigns[0]).toLowerCase()).toContain('active');
    });
});
