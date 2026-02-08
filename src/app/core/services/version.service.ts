import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';

@Injectable({ providedIn: 'root' })
export class VersionService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getVersion(): Observable<number> {
        return this.httpClient.get<number>(`${this.urls.apiUrl}/version`);
    }
}
