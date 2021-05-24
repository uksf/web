import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UrlService } from '../url.service';
import { SessionService } from './session.service';
import { AccountService } from '../account.service';
import { UksfError } from '../../Models/Response';

@Injectable()
export class AuthenticationService {
    constructor(private httpClient: HttpClient, private router: Router, private urls: UrlService, private sessionService: SessionService, private accountService: AccountService) {}

    public login(email: string, password: string, stayLogged: boolean, callback: (error?: UksfError) => void = null) {
        let body = { email: email, password: password };

        this.httpClient.post(`${this.urls.apiUrl}/auth/login`, body).subscribe(
            (response) => {
                this.sessionService.setSessionToken(response);
                if (stayLogged) {
                    this.sessionService.setStorageToken();
                }
                callback();
            },
            (error: UksfError) => {
                console.log(error.error);
                if (callback) {
                    callback(error);
                }
            }
        );
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

        this.httpClient.post(`${this.urls.apiUrl}/auth/passwordReset`, body).subscribe(
            () => {
                callback();
            },
            (error: UksfError) => {
                console.log(error.error);
                if (callback) {
                    callback(error);
                }
            }
        );
    }

    public passwordReset(email: string, password: string, resetPasswordCode: string, stayLogged: boolean, callback: (error?: UksfError) => void = null) {
        let body = { email: email, password: password };

        this.httpClient.post(`${this.urls.apiUrl}/auth/passwordReset/${resetPasswordCode}`, body).subscribe(
            (response) => {
                this.sessionService.setSessionToken(response);
                if (stayLogged) {
                    this.sessionService.setStorageToken();
                }
                callback();
            },
            (error: UksfError) => {
                console.log(error.error);
                if (callback) {
                    callback(error);
                }
            }
        );
    }

    public refresh(callback: () => void, errorCallback: (error: string) => void) {
        this.httpClient.get(`${this.urls.apiUrl}/auth/refresh`).subscribe(
            (response: any) => {
                this.sessionService.setSessionToken(response);
                this.sessionService.setStorageToken();
                callback();
            },
            (error: UksfError) => {
                errorCallback(error.error);
            }
        );
    }

    private finish(redirect: string, queryParams: any = {}) {
        this.router.navigate([redirect], queryParams).then();
    }
}
