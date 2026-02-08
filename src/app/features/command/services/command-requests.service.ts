import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { CommandRequest, CommandRequestsResponse } from '@app/features/command/models/command-request';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

export interface CommandRequestExistsBody {
    recipient: string;
    type: string;
    displayValue: string;
    displayFrom: string;
}

@Injectable({ providedIn: 'root' })
export class CommandRequestsService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getRequests(): Observable<CommandRequestsResponse> {
        return this.httpClient.get<CommandRequestsResponse>(`${this.urls.apiUrl}/commandrequests`);
    }

    setReview(requestId: string, reviewState: number, overriden: boolean): Observable<unknown> {
        return this.httpClient.patch(`${this.urls.apiUrl}/commandrequests/${requestId}`, { reviewState, overriden }, { headers: jsonHeaders });
    }

    createTransfer(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/transfer`, request);
    }

    createUnitRemoval(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/unitremoval`, request);
    }

    createRole(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/role`, request);
    }

    createRank(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/rank`, request);
    }

    createDischarge(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/discharge`, request);
    }

    createChainOfCommandPosition(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/chainofcommandposition`, request);
    }

    createReinstate(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/reinstate`, JSON.stringify(request), { headers: jsonHeaders });
    }

    createLoa(body: { reason: string; start: unknown; end: unknown; emergency: boolean; late: boolean }): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/loa`, body, { headers: jsonHeaders });
    }

    checkExists(body: CommandRequestExistsBody): Observable<boolean> {
        return this.httpClient.post<boolean>(`${this.urls.apiUrl}/commandrequests/exists`, JSON.stringify(body), { headers: jsonHeaders });
    }
}
