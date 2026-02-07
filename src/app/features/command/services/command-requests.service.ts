import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { CommandRequest } from '@app/features/command/models/command-request';

@Injectable()
export class CommandRequestsService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    createTransfer(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/transfer`, request);
    }

    createUnitRemoval(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/unitremoval`, request);
    }

    createRole(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/role`, request);
    }

    createChainOfCommandPosition(request: CommandRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/commandrequests/create/chainofcommandposition`, request);
    }
}
