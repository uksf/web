import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { OrderUpdateRequest } from '@app/shared/models/order-update-request';
import { GameServersUpdate, MissionUploadResponse, ServerMod, ServerModsResetResponse } from '../models/game-server';

@Injectable({ providedIn: 'root' })
export class GameServersService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    getServers(): Observable<GameServersUpdate> {
        return this.httpClient.get<GameServersUpdate>(`${this.urls.apiUrl}/gameservers`);
    }

    getDisabledState(): Observable<boolean> {
        return this.httpClient.get<boolean>(`${this.urls.apiUrl}/gameservers/disabled`);
    }

    toggleDisabledState(disabled: boolean): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/gameservers/disabled`, { state: !disabled });
    }

    deleteServer(serverId: string): Observable<void> {
        return this.httpClient.delete<void>(`${this.urls.apiUrl}/gameservers/${serverId}`);
    }

    updateServerOrder(body: OrderUpdateRequest): Observable<void> {
        return this.httpClient.patch<void>(`${this.urls.apiUrl}/gameservers/order`, body);
    }

    uploadMission(formData: FormData): Observable<MissionUploadResponse> {
        return this.httpClient.post<MissionUploadResponse>(`${this.urls.apiUrl}/missions/upload`, formData, {
            reportProgress: true
        });
    }

    launchServer(serverId: string, missionName: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/gameservers/launch/${serverId}`, { missionName });
    }

    stopServer(serverId: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/gameservers/stop/${serverId}`, null);
    }

    killServer(serverId: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/gameservers/kill/${serverId}`, null);
    }

    killAllServers(): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/gameservers/killall`, null);
    }

    addServer(body: string): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/gameservers`, body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        });
    }

    editServer(server: unknown): Observable<boolean> {
        return this.httpClient.patch<boolean>(`${this.urls.apiUrl}/gameservers`, server, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        });
    }

    checkServerExists(value: unknown, server: unknown): Observable<boolean> {
        return this.httpClient.post<boolean>(`${this.urls.apiUrl}/gameservers/${value}`, server);
    }

    getServerMods(serverId: string): Observable<ServerMod[]> {
        return this.httpClient.get<ServerMod[]>(`${this.urls.apiUrl}/gameservers/${serverId}/mods`);
    }

    updateServerMods(serverId: string, server: unknown): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/gameservers/${serverId}/mods`, server, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        });
    }

    resetServerMods(serverId: string): Observable<ServerModsResetResponse> {
        return this.httpClient.get<ServerModsResetResponse>(`${this.urls.apiUrl}/gameservers/${serverId}/mods/reset`, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        });
    }

    downloadLog(serverId: string, source: string): Observable<Blob> {
        return this.httpClient.get(`${this.urls.apiUrl}/gameservers/${serverId}/log/download?source=${encodeURIComponent(source)}`, {
            responseType: 'blob'
        });
    }
}
