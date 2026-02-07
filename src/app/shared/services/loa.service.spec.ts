import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoaService } from './loa.service';
import { HttpParams } from '@angular/common/http';
import { of } from 'rxjs';

describe('LoaService', () => {
    let service: LoaService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of({ data: [], totalCount: 0 })),
            delete: vi.fn().mockReturnValue(of(undefined))
        };
        service = new LoaService(mockHttpClient, { apiUrl: 'http://localhost:5500' } as any);
    });

    it('getLoas calls correct endpoint with params', () => {
        const params = new HttpParams().set('page', '1').set('pageSize', '15');
        service.getLoas(params).subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/loa', { params });
    });

    it('deleteLoa calls correct endpoint', () => {
        service.deleteLoa('loa123').subscribe();
        expect(mockHttpClient.delete).toHaveBeenCalledWith('http://localhost:5500/loa/loa123');
    });
});
