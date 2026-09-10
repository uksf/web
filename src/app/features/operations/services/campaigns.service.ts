import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { ValidationReport } from '@app/shared/models/response';
import { Campaign, CampaignMission, CampaignMissionDto, IntelPage, IntelScope, Operation } from '../models/campaign';

@Injectable({ providedIn: 'root' })
export class CampaignsService {
    private http = inject(HttpClient);
    private urls = inject(UrlService);

    getCampaigns(): Observable<Campaign[]> {
        return this.http.get<Campaign[]>(`${this.urls.apiUrl}/campaigns`);
    }

    getCampaign(id: string): Observable<Campaign> {
        return this.http.get<Campaign>(`${this.urls.apiUrl}/campaigns/${id}`);
    }

    addCampaign(campaign: Campaign): Observable<void> {
        return this.http.post<void>(`${this.urls.apiUrl}/campaigns`, campaign);
    }

    updateCampaign(campaign: Campaign): Observable<void> {
        return this.http.put<void>(`${this.urls.apiUrl}/campaigns`, campaign);
    }

    deleteCampaign(id: string): Observable<void> {
        return this.http.delete<void>(`${this.urls.apiUrl}/campaigns/${id}`);
    }

    getOperations(campaignId: string): Observable<Operation[]> {
        return this.http.get<Operation[]>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations`);
    }

    getOperation(campaignId: string, operationId: string): Observable<Operation> {
        return this.http.get<Operation>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations/${operationId}`);
    }

    addOperation(campaignId: string, operation: Operation): Observable<void> {
        return this.http.post<void>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations`, operation);
    }

    updateOperation(campaignId: string, operationId: string, operation: Operation): Observable<void> {
        return this.http.put<void>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations/${operationId}`, operation);
    }

    deleteOperation(campaignId: string, operationId: string): Observable<void> {
        return this.http.delete<void>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations/${operationId}`);
    }

    getCampaignMissions(campaignId: string): Observable<CampaignMissionDto[]> {
        return this.http.get<CampaignMissionDto[]>(`${this.urls.apiUrl}/campaigns/${campaignId}/missions`);
    }

    getMissions(campaignId: string, operationId: string): Observable<CampaignMissionDto[]> {
        return this.http.get<CampaignMissionDto[]>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations/${operationId}/missions`);
    }

    getMission(campaignId: string, operationId: string, missionId: string): Observable<CampaignMissionDto> {
        return this.http.get<CampaignMissionDto>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations/${operationId}/missions/${missionId}`);
    }

    addMission(campaignId: string, operationId: string, mission: CampaignMission): Observable<void> {
        return this.http.post<void>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations/${operationId}/missions`, mission);
    }

    updateMission(campaignId: string, operationId: string, mission: CampaignMission): Observable<void> {
        return this.http.put<void>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations/${operationId}/missions/${mission.id}`, mission);
    }

    deleteMission(campaignId: string, operationId: string, missionId: string): Observable<void> {
        return this.http.delete<void>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations/${operationId}/missions/${missionId}`);
    }

    launchMission(campaignId: string, operationId: string, missionId: string): Observable<ValidationReport[]> {
        return this.http.post<ValidationReport[]>(`${this.urls.apiUrl}/campaigns/${campaignId}/operations/${operationId}/missions/${missionId}/launch`, {});
    }

    getIntel(scope: IntelScope, ownerId: string): Observable<IntelPage[]> {
        return this.http.get<IntelPage[]>(`${this.urls.apiUrl}/intelpages?scope=${scope}&ownerId=${ownerId}`);
    }

    addIntel(page: IntelPage): Observable<void> {
        return this.http.post<void>(`${this.urls.apiUrl}/intelpages`, page);
    }

    updateIntel(page: IntelPage): Observable<void> {
        return this.http.put<void>(`${this.urls.apiUrl}/intelpages`, page);
    }

    deleteIntel(id: string): Observable<void> {
        return this.http.delete<void>(`${this.urls.apiUrl}/intelpages/${id}`);
    }
}
