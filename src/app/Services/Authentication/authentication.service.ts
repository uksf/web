import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { UrlService } from '../url.service';
import { SessionService } from './session.service';
import { PermissionsService } from '../permissions.service';
import { AccountService } from '../account.service';
import { StatesService } from '../states.service';

@Injectable()
export class AuthenticationService {
    constructor(
        private httpClient: HttpClient,
        private router: Router,
        private urls: UrlService,
        private sessionService: SessionService,
        private permissionService: PermissionsService,
        private route: ActivatedRoute,
        private accountService: AccountService
    ) { }

    tryAuth(email: string, password: string, redirect: string, validateCode: string, validateUri: string, callback: (any?) => void = null) {
        let payload = {};
        let uri = '';
        if (validateUri) {
            payload = { email: email, password: password, code: validateCode };
            uri = '/' + validateUri;
        } else {
            payload = { email: email, password: password };
            uri = '/login';
        }

        this.httpClient.post(this.urls.apiUrl + uri, payload).subscribe(response => {
            this.sessionService.setSessionToken(response);
            if (StatesService.stayLogged) {
                this.sessionService.setStorageToken();
            }
            this.permissionService.refresh().then(() => {
                this.finishAuth(redirect);
                if (callback) {
                    callback();
                }
            });
        }, (error) => {
            console.log(error);
            if (callback) {
                callback(error.error);
            }
        });
    }

    finishAuth(redirect: string) {
        this.router.navigate([redirect]);
    }

    public logout(redirectAfterLogin?: string) {
        this.sessionService.removeTokens();
        this.accountService.clear();
        this.permissionService.refresh();
        if (redirectAfterLogin && redirectAfterLogin !== '/login') {
            let redirect = redirectAfterLogin;
            if (this.route.snapshot.queryParams['redirect']) {
                redirect = this.route.snapshot.queryParams['redirect'];
            }
            this.router.navigate(['/login'], { queryParams: { redirect: redirect } });
        } else {
            this.router.navigate(['/login']);
        }
    }
}
