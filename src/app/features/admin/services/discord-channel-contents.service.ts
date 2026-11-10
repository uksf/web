import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { DiscordChannelContent, DiscordChannelContentRequest } from '@app/features/admin/models/discord-channel-content';

@Injectable()
export class DiscordChannelContentsService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    private get baseUrl(): string {
        return `${this.urls.apiUrl}/discord/channelContents`;
    }

    getAll(): Observable<DiscordChannelContent[]> {
        return this.httpClient.get<DiscordChannelContent[]>(this.baseUrl);
    }

    create(request: DiscordChannelContentRequest): Observable<DiscordChannelContent> {
        return this.httpClient.post<DiscordChannelContent>(this.baseUrl, request);
    }

    update(id: string, request: DiscordChannelContentRequest): Observable<DiscordChannelContent> {
        return this.httpClient.put<DiscordChannelContent>(`${this.baseUrl}/${id}`, request);
    }

    publish(id: string): Observable<DiscordChannelContent> {
        return this.httpClient.post<DiscordChannelContent>(`${this.baseUrl}/${id}/publish`, {});
    }
}
