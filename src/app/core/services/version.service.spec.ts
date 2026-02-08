import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VersionService } from './version.service';
import { of } from 'rxjs';

describe('VersionService', () => {
    let service: VersionService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of(0)),
        };
        service = new VersionService(mockHttpClient, { apiUrl: 'http://localhost:5500' } as any);
    });

    it('getVersion calls correct endpoint', () => {
        service.getVersion().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/version');
    });
});
