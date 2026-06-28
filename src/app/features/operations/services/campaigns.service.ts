import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { ValidationReport } from '@app/shared/models/response';
import { Campaign, IntelPage, IntelScope, Op, OpDto } from '../models/campaign';

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

    getOps(campaignId: string): Observable<OpDto[]> {
        return this.http.get<OpDto[]>(`${this.urls.apiUrl}/ops?campaignId=${campaignId}`);
    }

    getOp(id: string): Observable<OpDto> {
        return this.http.get<OpDto>(`${this.urls.apiUrl}/ops/${id}`);
    }

    addOp(op: Op): Observable<void> {
        return this.http.post<void>(`${this.urls.apiUrl}/ops`, op);
    }

    updateOp(op: Op): Observable<void> {
        return this.http.put<void>(`${this.urls.apiUrl}/ops`, op);
    }

    deleteOp(id: string): Observable<void> {
        return this.http.delete<void>(`${this.urls.apiUrl}/ops/${id}`);
    }

    launchOp(id: string): Observable<ValidationReport[]> {
        return this.http.post<ValidationReport[]>(`${this.urls.apiUrl}/ops/${id}/launch`, {});
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
