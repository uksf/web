import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavigationExtras, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { UrlService } from '../url.service';
import { SessionService } from './session.service';
import { AccountService } from '../account.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CreateAccount } from '@app/shared/models/account';

export interface TokenResponse {
    token: string;
}

@Injectable()
export class AuthenticationService {
    private impersonatingUserIdClaimKey = 'impersonator';

    constructor(
        private httpClient: HttpClient,
        private router: Router,
        private urls: UrlService,
        private sessionService: SessionService,
        private accountService: AccountService,
        private jwtHelperService: JwtHelperService
    ) {}

    public login(email: string, password: string, stayLogged: boolean): Observable<TokenResponse> {
        const body = { email, password };
        return this.httpClient.post<TokenResponse>(`${this.urls.apiUrl}/auth/login`, body).pipe(
            tap((response) => {
                this.sessionService.setSessionToken(response.token);
                if (stayLogged) {
                    this.sessionService.setStorageToken();
                }
            })
        );
    }

    public logout(redirectUrl?: string) {
        this.sessionService.removeTokens();
        this.accountService.clear();
        if (redirectUrl && redirectUrl.includes('redirect')) {
            return;
        }

        if (redirectUrl && redirectUrl !== '/login') {
            this.finish('/login', { queryParams: { redirect: redirectUrl } });
        } else {
            this.finish('/login');
        }
    }

    public requestPasswordReset(email: string): Observable<void> {
        const body = { email };
        return this.httpClient.post<void>(`${this.urls.apiUrl}/auth/passwordReset`, body);
    }

    public passwordReset(email: string, password: string, resetPasswordCode: string, stayLogged: boolean): Observable<TokenResponse> {
        const body = { email, password };
        return this.httpClient.post<TokenResponse>(`${this.urls.apiUrl}/auth/passwordReset/${resetPasswordCode}`, body).pipe(
            tap((response) => {
                this.sessionService.setSessionToken(response.token);
                if (stayLogged) {
                    this.sessionService.setStorageToken();
                }
            })
        );
    }

    public refresh(): Observable<TokenResponse> {
        return this.httpClient.get<TokenResponse>(`${this.urls.apiUrl}/auth/refresh`).pipe(
            tap((response) => {
                this.sessionService.setSessionToken(response.token);
                this.sessionService.setStorageToken();
            })
        );
    }

    public createAccount(createAccountBody: CreateAccount): Observable<TokenResponse> {
        return this.httpClient.post<TokenResponse>(this.urls.apiUrl + '/accounts/create', createAccountBody, {
            headers: new HttpHeaders({ 'Content-Type': 'application/json' })
        }).pipe(
            tap((response) => {
                this.sessionService.setSessionToken(response.token);
                this.sessionService.setStorageToken();
            })
        );
    }

    public impersonate(accountId: string): Observable<TokenResponse> {
        return this.httpClient.get<TokenResponse>(`${this.urls.apiUrl}/auth/impersonate?accountId=${accountId}`).pipe(
            tap((response) => {
                this.sessionService.setSessionToken(response.token);
                this.sessionService.setStorageToken();
            })
        );
    }

    public isImpersonated() {
        const jwtData = this.jwtHelperService.decodeToken(this.sessionService.getSessionToken());
        const impersonatingUserId: string = jwtData[this.impersonatingUserIdClaimKey];
        return !!impersonatingUserId;
    }

    private finish(redirect: string, queryParams: NavigationExtras = {}) {
        this.router.navigate([redirect], queryParams).then();
    }
}
