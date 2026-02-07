import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { ActiveApplication, CompletedApplication, DetailedApplication, Recruiter } from '@app/features/application/models/application';
import { PagedResult } from '@app/shared/models/paged-result';
import { OnlineState } from '@app/shared/models/online-state';

@Injectable()
export class RecruitmentService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getActiveApplications(): Observable<ActiveApplication[]> {
        return this.httpClient.get<ActiveApplication[]>(`${this.urls.apiUrl}/recruitment/applications/active`);
    }

    getCompletedApplications(params: HttpParams): Observable<PagedResult<CompletedApplication>> {
        return this.httpClient.get<PagedResult<CompletedApplication>>(`${this.urls.apiUrl}/recruitment/applications/completed`, { params });
    }

    getRecruiters(): Observable<Recruiter[]> {
        return this.httpClient.get<Recruiter[]>(`${this.urls.apiUrl}/recruitment/recruiters`);
    }

    getStats(): Observable<RecruitmentStatsResponse> {
        return this.httpClient.get<RecruitmentStatsResponse>(`${this.urls.apiUrl}/recruitment/stats`);
    }

    getApplication(accountId: string): Observable<DetailedApplication> {
        return this.httpClient.get<DetailedApplication>(`${this.urls.apiUrl}/recruitment/applications/${accountId}`);
    }

    setRecruiter(accountId: string, newRecruiter: string): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/recruitment/applications/${accountId}/recruiter`, { newRecruiter });
    }

    updateApplicationState(accountId: string, updatedState: unknown): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/recruitment/applications/${accountId}`, { updatedState });
    }

    getTeamspeakOnlineState(accountId: string): Observable<OnlineState> {
        return this.httpClient.get<OnlineState>(`${this.urls.apiUrl}/teamspeak/${accountId}/onlineUserDetails`);
    }

    getDiscordOnlineState(accountId: string): Observable<OnlineState> {
        return this.httpClient.get<OnlineState>(`${this.urls.apiUrl}/discord/${accountId}/onlineUserDetails`);
    }
}

export interface RecruiterActivity {
    account: { id: string; settings: unknown };
    name: string;
    active: number;
    accepted: number;
    rejected: number;
}

export interface RecruitmentStatField {
    fieldName: string;
    fieldValue: string;
}

export interface RecruitmentStats {
    lastMonth: RecruitmentStatField[];
    overall: RecruitmentStatField[];
}

export interface RecruitmentStatsResponse {
    activity: RecruiterActivity[];
    yourStats: RecruitmentStats;
    sr1Stats: RecruitmentStats;
}
