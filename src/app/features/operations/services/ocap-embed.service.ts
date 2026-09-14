import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';

export interface OcapEmbedTokenResponse {
    token: string;
    role: string;
    steamId: string;
}

@Injectable({ providedIn: 'root' })
export class OcapEmbedService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    getEmbedToken(): Observable<OcapEmbedTokenResponse> {
        return this.httpClient.get<OcapEmbedTokenResponse>(`${this.urls.apiUrl}/ocap/embed-token`);
    }
}
