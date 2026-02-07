import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { Loa } from '@app/features/command/models/loa';
import { PagedResult } from '@app/shared/models/paged-result';

@Injectable({ providedIn: 'root' })
export class LoaService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getLoas(params: HttpParams): Observable<PagedResult<Loa>> {
        return this.httpClient.get<PagedResult<Loa>>(`${this.urls.apiUrl}/loa`, { params });
    }

    deleteLoa(loaId: string): Observable<unknown> {
        return this.httpClient.delete(`${this.urls.apiUrl}/loa/${loaId}`);
    }
}
