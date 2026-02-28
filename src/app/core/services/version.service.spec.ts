import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { VersionService } from './version.service';
import { UrlService } from './url.service';
import { of } from 'rxjs';

describe('VersionService', () => {
    let service: VersionService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of(0)),
        };
        TestBed.configureTestingModule({
            providers: [
                VersionService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } },
            ]
        });
        service = TestBed.inject(VersionService);
    });

    it('getVersion calls correct endpoint', () => {
        service.getVersion().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/version');
    });
});
