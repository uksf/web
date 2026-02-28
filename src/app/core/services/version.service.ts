import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';

@Injectable({ providedIn: 'root' })
export class VersionService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    getVersion(): Observable<number> {
        return this.httpClient.get<number>(`${this.urls.apiUrl}/version`);
    }
}
