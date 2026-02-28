import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    connectSteam(id: string, body: { code: string }): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/steamcode/${id}`, body);
    }

    connectDiscord(id: string, body: { code: string }): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/discordcode/${id}`, body);
    }

    changePassword(body: string): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/accounts/password`, body, { headers: jsonHeaders });
    }

    changeName(body: string): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/accounts/name`, body, { headers: jsonHeaders });
    }

    updateSetting(accountId: string, settings: unknown): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/accounts/${accountId}/updatesetting`, settings);
    }
}
