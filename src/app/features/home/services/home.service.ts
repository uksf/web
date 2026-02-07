import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';

export interface TeamspeakOnlineUser {
    displayName: string;
}

export interface TeamspeakOnlineAccountsResponse {
    commanders: TeamspeakOnlineUser[];
    recruiters: TeamspeakOnlineUser[];
    members: TeamspeakOnlineUser[];
    guests: TeamspeakOnlineUser[];
}

export interface InstagramImage {
    id: string;
    permalink: string;
    media_type: string;
    media_url: string;
    timestamp: Date;
    base64: string;
}

@Injectable()
export class HomeService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getOnlineAccounts(): Observable<TeamspeakOnlineAccountsResponse> {
        return this.httpClient.get<TeamspeakOnlineAccountsResponse>(`${this.urls.apiUrl}/teamspeak/onlineAccounts`);
    }

    getInstagramImages(): Observable<InstagramImage[]> {
        return this.httpClient.get<InstagramImage[]>(`${this.urls.apiUrl}/instagram`);
    }
}
