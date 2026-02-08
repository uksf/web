import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamspeakConnectService } from './teamspeak-connect.service';
import { of } from 'rxjs';

describe('TeamspeakConnectService', () => {
    let service: TeamspeakConnectService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of(null)),
            post: vi.fn().mockReturnValue(of(null)),
        };
        service = new TeamspeakConnectService(mockHttpClient, { apiUrl: 'http://localhost:5500' } as any);
    });

    it('getOnlineClients calls correct endpoint', () => {
        service.getOnlineClients().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/teamspeak/online');
    });

    it('requestCode calls correct endpoint with json headers', () => {
        service.requestCode('ts-123').subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith(
            'http://localhost:5500/teamspeak/ts-123',
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('connectTeamspeak calls correct endpoint with code body', () => {
        service.connectTeamspeak('acc1', 'ts-123', 'abc123').subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/accounts/acc1/teamspeak/ts-123',
            { code: 'abc123' },
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });
});
