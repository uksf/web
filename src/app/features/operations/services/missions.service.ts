import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { Mission, MissionUploadResponse } from '../models/game-server';

@Injectable({ providedIn: 'root' })
export class MissionsService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    private buildHeaders(connectionId: string): HttpHeaders {
        return new HttpHeaders({ 'Hub-Connection-Id': connectionId });
    }

    getActiveMissions(): Observable<Mission[]> {
        return this.httpClient.get<Mission[]>(`${this.urls.apiUrl}/missions`);
    }

    getArchivedMissions(): Observable<Mission[]> {
        return this.httpClient.get<Mission[]>(`${this.urls.apiUrl}/missions/archived`);
    }

    uploadMission(formData: FormData, connectionId: string): Observable<MissionUploadResponse> {
        return this.httpClient.post<MissionUploadResponse>(`${this.urls.apiUrl}/missions/upload`, formData, {
            reportProgress: true,
            headers: this.buildHeaders(connectionId)
        });
    }

    downloadMission(fileName: string): Observable<Blob> {
        return this.httpClient.get(`${this.urls.apiUrl}/missions/${fileName}/download`, {
            responseType: 'blob'
        });
    }

    deleteMission(fileName: string, connectionId: string): Observable<void> {
        return this.httpClient.delete<void>(`${this.urls.apiUrl}/missions/${fileName}`, {
            headers: this.buildHeaders(connectionId)
        });
    }

    archiveMission(fileName: string, connectionId: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/missions/${fileName}/archive`, null, {
            headers: this.buildHeaders(connectionId)
        });
    }

    restoreMission(fileName: string, connectionId: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/missions/${fileName}/restore`, null, {
            headers: this.buildHeaders(connectionId)
        });
    }
}
