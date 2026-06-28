import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CampaignsService } from './campaigns.service';
import { UrlService } from '@app/core/services/url.service';
import { CampaignStatus, IntelScope, OpStatus } from '../models/campaign';

describe('CampaignsService', () => {
    let service: CampaignsService;
    let http: any;

    beforeEach(() => {
        http = {
            get: vi.fn().mockReturnValue(of(null)),
            post: vi.fn().mockReturnValue(of(null)),
            put: vi.fn().mockReturnValue(of(null)),
            delete: vi.fn().mockReturnValue(of(null))
        };
        TestBed.configureTestingModule({
            providers: [
                CampaignsService,
                { provide: HttpClient, useValue: http },
                { provide: UrlService, useValue: { apiUrl: 'http://api' } }
            ]
        });
        service = TestBed.inject(CampaignsService);
    });

    it('getCampaigns GETs /campaigns', () => {
        service.getCampaigns().subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/campaigns');
    });

    it('getOps GETs /ops with campaignId param', () => {
        service.getOps('c1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/ops?campaignId=c1');
    });

    it('launchOp POSTs /ops/{id}/launch', () => {
        service.launchOp('op1').subscribe();
        expect(http.post).toHaveBeenCalledWith('http://api/ops/op1/launch', {});
    });

    it('getIntel GETs /intelpages with numeric scope + ownerId', () => {
        service.getIntel(IntelScope.Op, 'op1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/intelpages?scope=1&ownerId=op1');
    });

    it('addCampaign POSTs the campaign', () => {
        const c = { id: '', name: 'X', brief: '', status: CampaignStatus.Active };
        service.addCampaign(c as any).subscribe();
        expect(http.post).toHaveBeenCalledWith('http://api/campaigns', c);
    });

    it('updateOp PUTs the op', () => {
        const op = { id: 'op1', campaignId: 'c1', title: 'T', scheduledTime: '', serverId: 's1', missionName: 'm', warno: '', status: OpStatus.Scheduled };
        service.updateOp(op as any).subscribe();
        expect(http.put).toHaveBeenCalledWith('http://api/ops', op);
    });

    it('deleteCampaign DELETEs /campaigns/{id}', () => {
        service.deleteCampaign('c1').subscribe();
        expect(http.delete).toHaveBeenCalledWith('http://api/campaigns/c1');
    });
});
