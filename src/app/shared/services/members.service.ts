import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { Account, BasicAccount } from '@app/shared/models/account';

@Injectable({ providedIn: 'root' })
export class MembersService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getMembers(): Observable<BasicAccount[]> {
        return this.httpClient.get<BasicAccount[]>(`${this.urls.apiUrl}/accounts/members`);
    }

    getAccount(id: string): Observable<Account> {
        return this.httpClient.get<Account>(`${this.urls.apiUrl}/accounts/${id}`);
    }
}
