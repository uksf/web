import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpParams } from '@angular/common/http';
import { LogsService } from './logs.service';
import { UrlService } from '@app/core/services/url.service';
import { of } from 'rxjs';

describe('LogsService', () => {
    let service: LogsService;
    let mockHttpClient: any;

    const mockParams = new HttpParams().set('page', '1').set('pageSize', '25');
    const mockPagedResult = { data: [], totalCount: 0 };

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of(mockPagedResult))
        };
        TestBed.configureTestingModule({
            providers: [
                LogsService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } },
            ]
        });
        service = TestBed.inject(LogsService);
    });

    it('getBasicLogs calls correct endpoint', () => {
        service.getBasicLogs(mockParams).subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/logging/basic', { params: mockParams });
    });

    it('getAuditLogs calls correct endpoint', () => {
        service.getAuditLogs(mockParams).subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/logging/audit', { params: mockParams });
    });

    it('getErrorLogs calls correct endpoint', () => {
        service.getErrorLogs(mockParams).subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/logging/error', { params: mockParams });
    });

    it('getDiscordLogs calls correct endpoint', () => {
        service.getDiscordLogs(mockParams).subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/logging/discord', { params: mockParams });
    });

    it('getLauncherLogs calls correct endpoint', () => {
        service.getLauncherLogs(mockParams).subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/logging/launcher', { params: mockParams });
    });
});
