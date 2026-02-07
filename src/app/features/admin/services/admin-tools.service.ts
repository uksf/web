import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { BasicAccount } from '@app/shared/models/account';

@Injectable()
export class AdminToolsService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getActiveAccounts(): Observable<BasicAccount[]> {
        return this.httpClient.get<BasicAccount[]>(`${this.urls.apiUrl}/accounts/active`);
    }

    invalidateCaches(): Observable<unknown> {
        return this.httpClient.get(`${this.urls.apiUrl}/data/invalidate`);
    }

    getDiscordRoles(): Observable<string> {
        return this.httpClient.get(`${this.urls.apiUrl}/discord/roles`, { responseType: 'text' });
    }

    updateDiscordRoles(): Observable<unknown> {
        return this.httpClient.get(`${this.urls.apiUrl}/discord/updateuserroles`);
    }

    deleteGithubIssueCommand(): Observable<unknown> {
        return this.httpClient.delete(`${this.urls.apiUrl}/discord/commands/newGithubIssue`);
    }

    reloadTeamspeak(): Observable<unknown> {
        return this.httpClient.get(`${this.urls.apiUrl}/teamspeak/reload`);
    }

    testNotification(): Observable<unknown> {
        return this.httpClient.get(`${this.urls.apiUrl}/debug/notifications-test`);
    }

    emergencyCleanupStuckBuilds(): Observable<{ message: string }> {
        return this.httpClient.post<{ message: string }>(`${this.urls.apiUrl}/modpack/builds/emergency-cleanup`, {});
    }
}
