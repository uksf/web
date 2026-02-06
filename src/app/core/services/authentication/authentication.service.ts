import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { UrlService } from '../url.service';
import { SessionService } from './session.service';
import { AccountService } from '../account.service';
import { UksfError } from '@app/shared/models/Response';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CreateAccount } from '@app/shared/models/Account';

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

    public login(email: string, password: string, stayLogged: boolean, callback: (error?: UksfError) => void = null) {
        let body = { email: email, password: password };

        this.httpClient.post(`${this.urls.apiUrl}/auth/login`, body).subscribe({
            next: (response: TokenResponse) => {
                this.sessionService.setSessionToken(response.token);
                if (stayLogged) {
                    this.sessionService.setStorageToken();
                }
                callback();
            },
            error: (error: UksfError) => {
                console.log(error.error);
                if (callback) {
                    callback(error);
                }
            }
        });
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

    public requestPasswordReset(email: string, callback: (error?: UksfError) => void = null) {
        let body = { email: email };

        this.httpClient.post(`${this.urls.apiUrl}/auth/passwordReset`, body).subscribe({
            next: () => {
                callback();
            },
            error: (error: UksfError) => {
                console.log(error.error);
                if (callback) {
                    callback(error);
                }
            }
        });
    }

    public passwordReset(email: string, password: string, resetPasswordCode: string, stayLogged: boolean, callback: (error?: UksfError) => void = null) {
        let body = { email: email, password: password };

        this.httpClient.post(`${this.urls.apiUrl}/auth/passwordReset/${resetPasswordCode}`, body).subscribe({
            next: (response: TokenResponse) => {
                this.sessionService.setSessionToken(response.token);
                if (stayLogged) {
                    this.sessionService.setStorageToken();
                }
                callback();
            },
            error: (error: UksfError) => {
                console.log(error.error);
                if (callback) {
                    callback(error);
                }
            }
        });
    }

    public refresh(callback: () => void, errorCallback: (error: string) => void) {
        this.httpClient.get(`${this.urls.apiUrl}/auth/refresh`).subscribe({
            next: (response: TokenResponse) => {
                this.sessionService.setSessionToken(response.token);
                this.sessionService.setStorageToken();
                callback();
            },
            error: (error: UksfError) => {
                errorCallback(error.error);
            }
        });
    }

    public createAccount(createAccountBody: CreateAccount, success: () => void, error: (errorMessage: string) => void) {
        this.httpClient.post(this.urls.apiUrl + '/accounts/create', createAccountBody, { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }).subscribe({
            next: (response: TokenResponse) => {
                this.sessionService.setSessionToken(response.token);
                this.sessionService.setStorageToken();
                success();
            },
            error: (errorValue: UksfError) => {
                error(errorValue.error);
            }
        });
    }

    public impersonate(accountId: string, callback: () => void, errorCallback: (error: string) => void) {
        this.httpClient.get(`${this.urls.apiUrl}/auth/impersonate?accountId=${accountId}`).subscribe({
            next: (impersonatedToken: TokenResponse) => {
                this.sessionService.setSessionToken(impersonatedToken.token);
                this.sessionService.setStorageToken();
                callback();
            },
            error: (error: UksfError) => {
                errorCallback(error.error);
            }
        });
    }

    public isImpersonated() {
        let jwtData = this.jwtHelperService.decodeToken(this.sessionService.getSessionToken());
        let impersonatingUserId: string = jwtData[this.impersonatingUserIdClaimKey];

        return !!impersonatingUserId;
    }

    private finish(redirect: string, queryParams: any = {}) {
        this.router.navigate([redirect], queryParams).then();
    }
}
