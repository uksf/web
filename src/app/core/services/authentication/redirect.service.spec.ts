import { describe, it, expect, beforeEach } from 'vitest';
import { RedirectService } from './redirect.service';

describe('RedirectService', () => {
    let service: RedirectService;
    let store: Record<string, string>;

    beforeEach(() => {
        store = {};
        (globalThis as any).localStorage = {
            getItem: (key: string) => store[key] ?? null,
            setItem: (key: string, value: string) => { store[key] = value; },
            removeItem: (key: string) => { delete store[key]; }
        };

        service = new RedirectService();
    });

    describe('setRedirectUrl', () => {
        it('stores a valid URL', () => {
            service.setRedirectUrl('/admin');

            expect(store['auth_redirect_url']).toBe('/admin');
        });

        it('ignores /login to prevent redirect loops', () => {
            service.setRedirectUrl('/login');

            expect(store['auth_redirect_url']).toBeUndefined();
        });

        it('ignores URLs starting with /login', () => {
            service.setRedirectUrl('/login?reset=abc');

            expect(store['auth_redirect_url']).toBeUndefined();
        });

        it('ignores empty or null URLs', () => {
            service.setRedirectUrl('');
            expect(store['auth_redirect_url']).toBeUndefined();

            service.setRedirectUrl(null as unknown as string);
            expect(store['auth_redirect_url']).toBeUndefined();
        });
    });

    describe('getAndClearRedirectUrl', () => {
        it('returns stored URL and removes it', () => {
            store['auth_redirect_url'] = '/admin';

            const result = service.getAndClearRedirectUrl();

            expect(result).toBe('/admin');
            expect(store['auth_redirect_url']).toBeUndefined();
        });

        it('returns null when no URL is stored', () => {
            expect(service.getAndClearRedirectUrl()).toBeNull();
        });
    });

    describe('clearRedirectUrl', () => {
        it('removes the stored URL', () => {
            store['auth_redirect_url'] = '/admin';

            service.clearRedirectUrl();

            expect(store['auth_redirect_url']).toBeUndefined();
        });
    });
});
