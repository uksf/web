import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LoaService } from './loa.service';
import { UrlService } from '@app/core/services/url.service';
import { of } from 'rxjs';

describe('LoaService', () => {
    let service: LoaService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of({ data: [], totalCount: 0 })),
            delete: vi.fn().mockReturnValue(of(undefined))
        };
        TestBed.configureTestingModule({
            providers: [
                LoaService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } },
            ]
        });
        service = TestBed.inject(LoaService);
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
