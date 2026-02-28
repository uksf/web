import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { DischargesService } from './discharges.service';
import { UrlService } from '@app/core/services/url.service';
import { of } from 'rxjs';

describe('DischargesService', () => {
    let service: DischargesService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of([]))
        };
        TestBed.configureTestingModule({
            providers: [
                DischargesService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } },
            ]
        });
        service = TestBed.inject(DischargesService);
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
