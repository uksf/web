import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { AuditLog, BasicLog, DiscordLog, ErrorLog, LauncherLog } from '@app/features/admin/models/logging';
import { PagedResult } from '@app/shared/models/paged-result';

@Injectable()
export class LogsService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getBasicLogs(params: HttpParams): Observable<PagedResult<BasicLog>> {
        return this.httpClient.get<PagedResult<BasicLog>>(`${this.urls.apiUrl}/logging/basic`, { params });
    }

    getAuditLogs(params: HttpParams): Observable<PagedResult<AuditLog>> {
        return this.httpClient.get<PagedResult<AuditLog>>(`${this.urls.apiUrl}/logging/audit`, { params });
    }

    getErrorLogs(params: HttpParams): Observable<PagedResult<ErrorLog>> {
        return this.httpClient.get<PagedResult<ErrorLog>>(`${this.urls.apiUrl}/logging/error`, { params });
    }

    getDiscordLogs(params: HttpParams): Observable<PagedResult<DiscordLog>> {
        return this.httpClient.get<PagedResult<DiscordLog>>(`${this.urls.apiUrl}/logging/discord`, { params });
    }

    getLauncherLogs(params: HttpParams): Observable<PagedResult<LauncherLog>> {
        return this.httpClient.get<PagedResult<LauncherLog>>(`${this.urls.apiUrl}/logging/launcher`, { params });
    }
}
