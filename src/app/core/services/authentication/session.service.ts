import { Injectable } from '@angular/core';

@Injectable()
export class SessionService {
    constructor() {}

    hasStorageToken(): boolean {
        return !!localStorage.getItem('access_token');
    }

    hasToken(): boolean {
        return !!sessionStorage.getItem('access_token') || !!localStorage.getItem('access_token');
    }

    setStorageToken(): void {
        localStorage.setItem('access_token', sessionStorage.getItem('access_token'));
    }

    setSessionToken(token?: string): void {
        if (!token) {
            if (this.hasStorageToken()) {
                token = localStorage.getItem('access_token');
            } else {
                return;
            }
        }
        sessionStorage.setItem('access_token', token);
    }

    getSessionToken(): string | null {
        return sessionStorage.getItem('access_token');
    }

    removeTokens(): void {
        sessionStorage.removeItem('access_token');
        localStorage.removeItem('access_token');
    }
}
