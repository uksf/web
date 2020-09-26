import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UrlService } from '../url.service';
import { SessionService } from './session.service';
import { AccountService } from '../account.service';
import { StatesService } from '../states.service';

@Injectable()
export class AuthenticationService {
    constructor(private httpClient: HttpClient, private router: Router, private urls: UrlService, private sessionService: SessionService, private accountService: AccountService) {}

    tryAuth(email: string, password: string, validateCode: string, validateUri: string, callback: (any?) => void = null) {
        let payload;
        let uri;
        if (validateUri) {
            payload = { email: email, password: password, code: validateCode };
            uri = '/' + validateUri;
        } else {
            payload = { email: email, password: password };
            uri = '/login';
        }

        this.httpClient.post(this.urls.apiUrl + uri, payload).subscribe(
            (response) => {
                this.sessionService.setSessionToken(response);
                if (StatesService.stayLogged) {
                    this.sessionService.setStorageToken();
                }
                callback();
            },
            (error) => {
                console.log(error);
                if (callback) {
                    callback(error.error);
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

    public refresh(callback: () => void = null) {
        this.httpClient.get(this.urls.apiUrl + '/login/refresh').subscribe(
            (response: any) => {
                this.sessionService.setSessionToken(response);
                if (StatesService.stayLogged) {
                    this.sessionService.setStorageToken();
                }
                callback();
            },
            (_) => {
                console.log('Token was refreshed but something failed');
            }
        );
    }

    private finish(redirect: string, queryParams: any = {}) {
        this.router.navigate([redirect], queryParams).then();
    }
}
