import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { OrderUpdateRequest } from '@app/shared/models/order-update-request';
import { GameServer, GameServersResponse, MissionUploadResponse, ServerMod, ServerModsResetResponse, ServerStatusResponse } from '../models/game-server';

@Injectable()
export class GameServersService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    private buildHeaders(connectionId: string): HttpHeaders {
        return new HttpHeaders({ 'Hub-Connection-Id': connectionId });
    }

    getServers(): Observable<GameServersResponse> {
        return this.httpClient.get<GameServersResponse>(`${this.urls.apiUrl}/gameservers`);
    }

    getDisabledState(): Observable<boolean> {
        return this.httpClient.get<boolean>(`${this.urls.apiUrl}/gameservers/disabled`);
    }

    getServerStatus(serverId: string): Observable<ServerStatusResponse> {
        return this.httpClient.get<ServerStatusResponse>(`${this.urls.apiUrl}/gameservers/status/${serverId}`);
    }

    toggleDisabledState(disabled: boolean, connectionId: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/gameservers/disabled`, { state: !disabled }, { headers: this.buildHeaders(connectionId) });
    }

    deleteServer(serverId: string, connectionId: string): Observable<GameServer[]> {
        return this.httpClient.delete<GameServer[]>(`${this.urls.apiUrl}/gameservers/${serverId}`, { headers: this.buildHeaders(connectionId) });
    }

    updateServerOrder(body: OrderUpdateRequest, connectionId: string): Observable<GameServer[]> {
        return this.httpClient.patch<GameServer[]>(`${this.urls.apiUrl}/gameservers/order`, body, { headers: this.buildHeaders(connectionId) });
    }

    uploadMission(formData: FormData, connectionId: string): Observable<MissionUploadResponse> {
        return this.httpClient.post<MissionUploadResponse>(`${this.urls.apiUrl}/gameservers/mission`, formData, {
            reportProgress: true,
            headers: this.buildHeaders(connectionId)
        });
    }

    launchServer(serverId: string, missionName: string, connectionId: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/gameservers/launch/${serverId}`, { missionName }, { headers: this.buildHeaders(connectionId) });
    }

    stopServer(serverId: string, connectionId: string): Observable<ServerStatusResponse> {
        return this.httpClient.post<ServerStatusResponse>(`${this.urls.apiUrl}/gameservers/stop/${serverId}`, null, { headers: this.buildHeaders(connectionId) });
    }

    killServer(serverId: string, connectionId: string): Observable<ServerStatusResponse> {
        return this.httpClient.post<ServerStatusResponse>(`${this.urls.apiUrl}/gameservers/kill/${serverId}`, null, { headers: this.buildHeaders(connectionId) });
    }

    killAllServers(connectionId: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/gameservers/killall`, null, { headers: this.buildHeaders(connectionId) });
    }

    addServer(body: string, connectionId: string): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/gameservers`, body, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Hub-Connection-Id': connectionId })
        });
    }

    editServer(server: unknown, connectionId: string): Observable<boolean> {
        return this.httpClient.patch<boolean>(`${this.urls.apiUrl}/gameservers`, server, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Hub-Connection-Id': connectionId })
        });
    }

    checkServerExists(value: unknown, server: unknown, connectionId: string): Observable<boolean> {
        return this.httpClient.post<boolean>(`${this.urls.apiUrl}/gameservers/${value}`, server, {
            headers: this.buildHeaders(connectionId)
        });
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
}
