import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { CampaignsService } from './campaigns.service';
import { UrlService } from '@app/core/services/url.service';
import { CampaignMissionStatus, CampaignStatus, IntelScope, OperationStatus } from '../models/campaign';

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

    it('getOperations GETs nested operations for the campaign, not a sibling', () => {
        service.getOperations('c1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/campaigns/c1/operations');
        expect(http.get).not.toHaveBeenCalledWith('http://api/campaigns/c2/operations');
    });

    it('getOperation GETs the nested operation item', () => {
        service.getOperation('c1', 'op1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/campaigns/c1/operations/op1');
    });

    it('getCampaignMissions GETs the campaign-scoped mission projection', () => {
        service.getCampaignMissions('c1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/campaigns/c1/missions');
    });

    it('getMissions GETs nested missions for campaign + operation', () => {
        service.getMissions('c1', 'op1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/campaigns/c1/operations/op1/missions');
        expect(http.get).not.toHaveBeenCalledWith('http://api/campaigns/c1/operations/op2/missions');
    });

    it('getMission GETs the nested mission item', () => {
        service.getMission('c1', 'op1', 'm1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/campaigns/c1/operations/op1/missions/m1');
    });

    it('launchMission POSTs the leaf launch route', () => {
        service.launchMission('c1', 'op1', 'm1').subscribe();
        expect(http.post).toHaveBeenCalledWith('http://api/campaigns/c1/operations/op1/missions/m1/launch', {});
    });

    it('getIntel GETs /intelpages with numeric campaign scope + ownerId', () => {
        service.getIntel(IntelScope.Campaign, 'c1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/intelpages?scope=0&ownerId=c1');
    });

    it('getIntel GETs /intelpages with numeric operation scope + ownerId', () => {
        service.getIntel(IntelScope.Operation, 'op1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/intelpages?scope=1&ownerId=op1');
    });

    it('getIntel GETs /intelpages with numeric mission scope + ownerId', () => {
        service.getIntel(IntelScope.Mission, 'm1').subscribe();
        expect(http.get).toHaveBeenCalledWith('http://api/intelpages?scope=2&ownerId=m1');
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

    it('addOperation POSTs the operation under the campaign', () => {
        const operation = { id: '', campaignId: 'c1', title: 'T', brief: '', status: OperationStatus.Upcoming };
        service.addOperation('c1', operation as any).subscribe();
        expect(http.post).toHaveBeenCalledWith('http://api/campaigns/c1/operations', operation);
    });

    it('updateOperation PUTs the nested operation item', () => {
        const operation = { id: 'op1', campaignId: 'c1', title: 'T', brief: '', status: OperationStatus.Current };
        service.updateOperation('c1', 'op1', operation as any).subscribe();
        expect(http.put).toHaveBeenCalledWith('http://api/campaigns/c1/operations/op1', operation);
    });

    it('deleteOperation DELETEs the nested operation item', () => {
        service.deleteOperation('c1', 'op1').subscribe();
        expect(http.delete).toHaveBeenCalledWith('http://api/campaigns/c1/operations/op1');
    });

    it('addMission POSTs the mission under campaign + operation', () => {
        const mission = { id: '', operationId: 'op1', title: 'T', scheduledTime: '', serverId: 's1', missionName: 'm', warno: '', status: CampaignMissionStatus.Scheduled };
        service.addMission('c1', 'op1', mission as any).subscribe();
        expect(http.post).toHaveBeenCalledWith('http://api/campaigns/c1/operations/op1/missions', mission);
    });

    it('updateMission PUTs the nested mission item', () => {
        const mission = { id: 'm1', operationId: 'op1', title: 'T', scheduledTime: '', serverId: 's1', missionName: 'm', warno: '', status: CampaignMissionStatus.Scheduled };
        service.updateMission('c1', 'op1', mission as any).subscribe();
        expect(http.put).toHaveBeenCalledWith('http://api/campaigns/c1/operations/op1/missions/m1', mission);
    });

    it('deleteMission DELETEs the nested mission item', () => {
        service.deleteMission('c1', 'op1', 'm1').subscribe();
        expect(http.delete).toHaveBeenCalledWith('http://api/campaigns/c1/operations/op1/missions/m1');
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
