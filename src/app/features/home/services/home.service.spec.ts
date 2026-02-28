import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HomeService } from './home.service';
import { UrlService } from '@app/core/services/url.service';
import { of } from 'rxjs';

describe('HomeService', () => {
    let service: HomeService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of(null)),
        };
        TestBed.configureTestingModule({
            providers: [
                HomeService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } },
            ]
        });
        service = TestBed.inject(HomeService);
    });

    it('getOnlineAccounts calls correct endpoint', () => {
        service.getOnlineAccounts().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/teamspeak/onlineAccounts');
    });

    it('getInstagramImages calls correct endpoint', () => {
        service.getInstagramImages().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/instagram');
    });
});
