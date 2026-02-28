import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ProfileService } from './profile.service';
import { UrlService } from '@app/core/services/url.service';
import { of } from 'rxjs';

describe('ProfileService', () => {
    let service: ProfileService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of(null)),
            post: vi.fn().mockReturnValue(of(null)),
            put: vi.fn().mockReturnValue(of(null)),
        };
        TestBed.configureTestingModule({
            providers: [
                ProfileService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } },
            ]
        });
        service = TestBed.inject(ProfileService);
    });

    it('connectSteam calls correct endpoint', () => {
        service.connectSteam('abc123', { code: 'xyz' }).subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/steamcode/abc123', { code: 'xyz' });
    });

    it('connectDiscord calls correct endpoint', () => {
        service.connectDiscord('disc456', { code: 'xyz' }).subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/discordcode/disc456', { code: 'xyz' });
    });

    it('changePassword calls correct endpoint', () => {
        const body = '{"password":"test"}';
        service.changePassword(body).subscribe();
        expect(mockHttpClient.put).toHaveBeenCalledWith(
            'http://localhost:5500/accounts/password',
            body,
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('changeName calls correct endpoint', () => {
        const body = '{"firstName":"John","lastName":"Doe"}';
        service.changeName(body).subscribe();
        expect(mockHttpClient.put).toHaveBeenCalledWith(
            'http://localhost:5500/accounts/name',
            body,
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('updateSetting calls correct endpoint', () => {
        const settings = { notificationsEmail: true };
        service.updateSetting('acc1', settings).subscribe();
        expect(mockHttpClient.put).toHaveBeenCalledWith('http://localhost:5500/accounts/acc1/updatesetting', settings);
    });
});
