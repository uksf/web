import { Injectable } from '@angular/core';

@Injectable()
export class SessionService {
    constructor() {}

    hasStorageToken() {
        return !!localStorage.getItem('access_token');
    }

    setStorageToken() {
        localStorage.setItem('access_token', sessionStorage.getItem('access_token'));
    }

    setSessionToken(token?) {
        if (!token && this.hasStorageToken()) {
            token = localStorage.getItem('access_token');
        }
        sessionStorage.setItem('access_token', token);
    }

    getSessionToken() {
        return sessionStorage.getItem('access_token');
    }

    removeTokens() {
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('access_token');
    }
}
