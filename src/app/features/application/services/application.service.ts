import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable()
export class ApplicationService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    submitApplication(accountId: string, details: string): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/accounts/${accountId}/application`, details, { headers: jsonHeaders });
    }

    updateApplication(accountId: string, body: string): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/accounts/${accountId}/application`, body, { headers: jsonHeaders });
    }

    validateEmailCode(body: { email: string; code: string }): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/accounts/code`, body, { headers: jsonHeaders });
    }

    resendEmailCode(): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/accounts/resend-email-code`, {});
    }

    getNations(): Observable<string[]> {
        return this.httpClient.get<string[]>(`${this.urls.apiUrl}/accounts/nations`);
    }

    checkEmailExists(email: string): Observable<boolean> {
        return this.httpClient.get<boolean>(`${this.urls.apiUrl}/accounts/exists?check=${email}`);
    }
}
