import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { Account, BasicAccount, RosterAccount } from '@app/shared/models/account';
import { PagedResult } from '@app/shared/models/paged-result';

@Injectable({ providedIn: 'root' })
export class MembersService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getMembers(reverse?: boolean): Observable<BasicAccount[]> {
        let url = `${this.urls.apiUrl}/accounts/members`;
        if (reverse) { url += '?reverse=true'; }
        return this.httpClient.get<BasicAccount[]>(url);
    }

    getAccount(id: string): Observable<Account> {
        return this.httpClient.get<Account>(`${this.urls.apiUrl}/accounts/${id}`);
    }

    getRoster(): Observable<RosterAccount[]> {
        return this.httpClient.get<RosterAccount[]>(`${this.urls.apiUrl}/accounts/roster`);
    }

    getCommandMembers(params: HttpParams): Observable<PagedResult<Account>> {
        return this.httpClient.get<PagedResult<Account>>(`${this.urls.apiUrl}/command/members`, { params });
    }

    updateQualifications(accountId: string, qualifications: unknown): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/accounts/${accountId}/qualifications`, qualifications);
    }
}
