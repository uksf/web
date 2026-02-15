import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionService } from './session.service';

describe('SessionService', () => {
    let service: SessionService;
    let mockLocalStorage: Record<string, string>;
    let mockSessionStorage: Record<string, string>;

    beforeEach(() => {
        mockLocalStorage = {};
        mockSessionStorage = {};

        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
            setItem: vi.fn((key: string, value: string) => { mockLocalStorage[key] = value; }),
            removeItem: vi.fn((key: string) => { delete mockLocalStorage[key]; })
        });

        vi.stubGlobal('sessionStorage', {
            getItem: vi.fn((key: string) => mockSessionStorage[key] ?? null),
            setItem: vi.fn((key: string, value: string) => { mockSessionStorage[key] = value; }),
            removeItem: vi.fn((key: string) => { delete mockSessionStorage[key]; })
        });

        service = new SessionService();
    });

    describe('hasStorageToken', () => {
        it('returns true when localStorage has access_token', () => {
            mockLocalStorage['access_token'] = 'some-token';

            expect(service.hasStorageToken()).toBe(true);
        });

        it('returns false when localStorage has no access_token', () => {
            expect(service.hasStorageToken()).toBe(false);
        });
    });

    describe('hasToken', () => {
        it('returns true when only sessionStorage has token', () => {
            mockSessionStorage['access_token'] = 'session-token';

            expect(service.hasToken()).toBe(true);
        });

        it('returns true when only localStorage has token', () => {
            mockLocalStorage['access_token'] = 'storage-token';

            expect(service.hasToken()).toBe(true);
        });

        it('returns true when both storages have token', () => {
            mockSessionStorage['access_token'] = 'session-token';
            mockLocalStorage['access_token'] = 'storage-token';

            expect(service.hasToken()).toBe(true);
        });

        it('returns false when neither storage has token', () => {
            expect(service.hasToken()).toBe(false);
        });
    });

    describe('setStorageToken', () => {
        it('copies session token to localStorage', () => {
            mockSessionStorage['access_token'] = 'session-token';

            service.setStorageToken();

            expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'session-token');
        });
    });

    describe('setSessionToken', () => {
        it('sets session token from provided value', () => {
            service.setSessionToken('new-token');

            expect(sessionStorage.setItem).toHaveBeenCalledWith('access_token', 'new-token');
        });

        it('copies from localStorage when no token provided and storage token exists', () => {
            mockLocalStorage['access_token'] = 'stored-token';

            service.setSessionToken();

            expect(sessionStorage.setItem).toHaveBeenCalledWith('access_token', 'stored-token');
        });

        it('does not set sessionStorage when no token provided and no storage token', () => {
            service.setSessionToken();

            expect(sessionStorage.setItem).not.toHaveBeenCalled();
        });
    });

    describe('getSessionToken', () => {
        it('returns session token from sessionStorage', () => {
            mockSessionStorage['access_token'] = 'my-jwt';

            expect(service.getSessionToken()).toBe('my-jwt');
        });

        it('returns null when no session token exists', () => {
            expect(service.getSessionToken()).toBeNull();
        });
    });

    describe('removeTokens', () => {
        it('removes tokens from both storages', () => {
            mockLocalStorage['access_token'] = 'local-token';
            mockSessionStorage['access_token'] = 'session-token';

            service.removeTokens();

            expect(sessionStorage.removeItem).toHaveBeenCalledWith('access_token');
            expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
        });
    });
});
