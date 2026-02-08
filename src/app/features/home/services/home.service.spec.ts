import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HomeService } from './home.service';
import { of } from 'rxjs';

describe('HomeService', () => {
    let service: HomeService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of(null)),
        };
        service = new HomeService(mockHttpClient, { apiUrl: 'http://localhost:5500' } as any);
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
