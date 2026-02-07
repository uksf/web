import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { Rank } from '@app/shared/models/rank';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable()
export class RanksService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getRanks(): Observable<Rank[]> {
        return this.httpClient.get<Rank[]>(`${this.urls.apiUrl}/ranks`);
    }

    checkRankExists(rank: Rank): Observable<boolean> {
        return this.httpClient.post<boolean>(`${this.urls.apiUrl}/ranks/exists`, rank, { headers: jsonHeaders });
    }

    editRank(rank: Rank): Observable<Rank[]> {
        return this.httpClient.patch<Rank[]>(`${this.urls.apiUrl}/ranks`, rank, { headers: jsonHeaders });
    }

    deleteRank(rankId: string): Observable<Rank[]> {
        return this.httpClient.delete<Rank[]>(`${this.urls.apiUrl}/ranks/${rankId}`);
    }

    addRank(formJson: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/ranks`, formJson, { headers: jsonHeaders });
    }

    checkRankName(name: string): Observable<boolean> {
        return this.httpClient.post<boolean>(`${this.urls.apiUrl}/ranks/${name}`, {});
    }

    updateRankOrder(ranks: Rank[]): Observable<Rank[]> {
        return this.httpClient.post<Rank[]>(`${this.urls.apiUrl}/ranks/order`, ranks);
    }
}
