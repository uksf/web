import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import type { ServerInfrastructureCurrent, ServerInfrastructureInstalled, ServerInfrastructureLatest, ServerInfrastructureUpdate } from '@app/shared/models/server-infrastructure';

@Injectable()
export class InfrastructureService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    isUpdating(): Observable<boolean> {
        return this.httpClient.get<boolean>(`${this.urls.apiUrl}/servers/infrastructure/isUpdating`);
    }

    getLatest(): Observable<ServerInfrastructureLatest> {
        return this.httpClient.get<ServerInfrastructureLatest>(`${this.urls.apiUrl}/servers/infrastructure/latest`);
    }

    getCurrent(): Observable<ServerInfrastructureCurrent> {
        return this.httpClient.get<ServerInfrastructureCurrent>(`${this.urls.apiUrl}/servers/infrastructure/current`);
    }

    getInstalled(): Observable<ServerInfrastructureInstalled> {
        return this.httpClient.get<ServerInfrastructureInstalled>(`${this.urls.apiUrl}/servers/infrastructure/installed`);
    }

    update(): Observable<ServerInfrastructureUpdate> {
        return this.httpClient.get<ServerInfrastructureUpdate>(`${this.urls.apiUrl}/servers/infrastructure/update`);
    }
}
