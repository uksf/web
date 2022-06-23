import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UrlService } from '../url.service';
import { SessionService } from './session.service';
import { AccountService } from '../account.service';
import { UksfError } from '../../Models/Response';
import { JwtHelperService } from '@auth0/angular-jwt';

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
            next: (response) => {
                this.sessionService.setSessionToken(response);
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

    public logout(redirect?: string) {
        this.sessionService.removeTokens();
        this.accountService.clear();
        if (redirect && redirect !== '/login') {
            this.finish('/login', { queryParams: { redirect: redirect } });
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
            next: (response) => {
                this.sessionService.setSessionToken(response);
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
            next: (response: any) => {
                this.sessionService.setSessionToken(response);
                this.sessionService.setStorageToken();
                callback();
            },
            error: (error: UksfError) => {
                errorCallback(error.error);
            }
        });
    }

    public impersonate(accountId: string, callback: () => void, errorCallback: (error: string) => void) {
        this.httpClient.get(`${this.urls.apiUrl}/auth/impersonate?accountId=${accountId}`).subscribe({
            next: (impersonatedToken: string) => {
                this.sessionService.setSessionToken(impersonatedToken);
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
