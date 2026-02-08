import { Injectable } from '@angular/core';

const REDIRECT_KEY = 'auth_redirect_url';

@Injectable()
export class RedirectService {
    setRedirectUrl(url: string): void {
        if (!url || url === '/login' || url.startsWith('/login')) {
            return;
        }
        localStorage.setItem(REDIRECT_KEY, url);
    }

    getAndClearRedirectUrl(): string | null {
        const url = localStorage.getItem(REDIRECT_KEY);
        localStorage.removeItem(REDIRECT_KEY);
        return url;
    }

    clearRedirectUrl(): void {
        localStorage.removeItem(REDIRECT_KEY);
    }
}
