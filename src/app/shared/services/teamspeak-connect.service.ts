import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { TeamspeakConnectClient } from '@app/shared/models/teamspeak-connect-client';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable({ providedIn: 'root' })
export class TeamspeakConnectService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getOnlineClients(): Observable<TeamspeakConnectClient[]> {
        return this.httpClient.get<TeamspeakConnectClient[]>(`${this.urls.apiUrl}/teamspeak/online`);
    }

    requestCode(teamspeakId: string): Observable<unknown> {
        return this.httpClient.get(`${this.urls.apiUrl}/teamspeak/${teamspeakId}`, { headers: jsonHeaders });
    }

    connectTeamspeak(accountId: string, teamspeakId: string, code: string): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/accounts/${accountId}/teamspeak/${teamspeakId}`, { code }, { headers: jsonHeaders });
    }
}
