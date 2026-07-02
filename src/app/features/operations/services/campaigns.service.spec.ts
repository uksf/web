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

    it('getCampaign GETs /campaigns/{id}', () => {
        service.getCampaign('c1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/campaigns/c1');
    });

    it('getOps GETs /ops with campaignId param', () => {
        service.getOps('c1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/ops?campaignId=c1');
    });

    it('getAllOps GETs /ops with no filter', () => {
        service.getAllOps().subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/ops');
    });

    it('getOp GETs /ops/{id}', () => {
        service.getOp('op1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/ops/op1');
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
        const c = { id: '', name: 'X', summary: '', status: CampaignStatus.Current };
        service.addCampaign(c as any).subscribe();
        expect(http.post).toHaveBeenCalledWith('http://api/campaigns', c);
    });

    it('updateCampaign PUTs the campaign', () => {
        const c = { id: 'c1', name: 'X', summary: '', status: CampaignStatus.Current };
        service.updateCampaign(c as any).subscribe();
        expect(http.put).toHaveBeenCalledWith('http://api/campaigns', c);
    });

    it('addOp POSTs the op', () => {
        const op = { id: '', campaignId: 'c1', title: 'T', scheduledTime: '', serverId: 's1', missionName: 'm', warno: '', status: OpStatus.Scheduled };
        service.addOp(op as any).subscribe();
        expect(http.post).toHaveBeenCalledWith('http://api/ops', op);
    });

    it('updateOp PUTs the op', () => {
        const op = { id: 'op1', campaignId: 'c1', title: 'T', scheduledTime: '', serverId: 's1', missionName: 'm', warno: '', status: OpStatus.Scheduled };
        service.updateOp(op as any).subscribe();
        expect(http.put).toHaveBeenCalledWith('http://api/ops', op);
    });

    it('deleteOp DELETEs /ops/{id}', () => {
        service.deleteOp('op1').subscribe();
        expect(http.delete).toHaveBeenCalledWith('http://api/ops/op1');
    });

    it('addIntel POSTs the intel page', () => {
        const page = { id: '', scope: IntelScope.Campaign, ownerId: 'c1', title: 'T', body: '' };
        service.addIntel(page as any).subscribe();
        expect(http.post).toHaveBeenCalledWith('http://api/intelpages', page);
    });

    it('updateIntel PUTs the intel page', () => {
        const page = { id: 'i1', scope: IntelScope.Campaign, ownerId: 'c1', title: 'T', body: '' };
        service.updateIntel(page as any).subscribe();
        expect(http.put).toHaveBeenCalledWith('http://api/intelpages', page);
    });

    it('deleteIntel DELETEs /intelpages/{id}', () => {
        service.deleteIntel('i1').subscribe();
        expect(http.delete).toHaveBeenCalledWith('http://api/intelpages/i1');
    });

    it('deleteCampaign DELETEs /campaigns/{id}', () => {
        service.deleteCampaign('c1').subscribe();
        expect(http.delete).toHaveBeenCalledWith('http://api/campaigns/c1');
    });
});
