import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DischargesService } from './discharges.service';
import { of } from 'rxjs';

describe('DischargesService', () => {
    let service: DischargesService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of([]))
        };
        service = new DischargesService(mockHttpClient, { apiUrl: 'http://localhost:5500' } as any);
    });

    it('getDischarges calls correct endpoint', () => {
        service.getDischarges().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/discharges');
    });

    it('reinstateDischarge calls correct endpoint', () => {
        service.reinstateDischarge('abc123').subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/discharges/reinstate/abc123');
    });
});
