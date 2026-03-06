import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ApplicationAnalyticsService, VISITOR_ID_KEY } from './application-analytics.service';
import { UrlService } from '@app/core/services/url.service';

describe('ApplicationAnalyticsService', () => {
    let service: ApplicationAnalyticsService;
    let mockHttp: { post: ReturnType<typeof vi.fn> };
    let mockUrls: { apiUrl: string };
    let mockStorage: Record<string, string>;

    beforeEach(() => {
        mockStorage = {};
        (globalThis as any).localStorage = {
            getItem: vi.fn((key: string) => mockStorage[key] ?? null),
            setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
            removeItem: vi.fn((key: string) => { delete mockStorage[key]; })
        };
        vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid-1234' as `${string}-${string}-${string}-${string}-${string}`);

        mockHttp = { post: vi.fn().mockReturnValue(of(undefined)) };
        mockUrls = { apiUrl: 'http://localhost:5500' };

        TestBed.configureTestingModule({
            providers: [
                ApplicationAnalyticsService,
                { provide: HttpClient, useValue: mockHttp },
                { provide: UrlService, useValue: mockUrls }
            ]
        });
        service = TestBed.inject(ApplicationAnalyticsService);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should generate and store a visitor ID if none exists', () => {
        service.trackEvent('info_page_view');

        expect(localStorage.setItem).toHaveBeenCalledWith(VISITOR_ID_KEY, 'test-uuid-1234');
        expect(mockHttp.post).toHaveBeenCalledWith(
            'http://localhost:5500/application/analytics/event',
            expect.objectContaining({ visitorId: 'test-uuid-1234', event: 'info_page_view' })
        );
    });

    it('should reuse existing visitor ID', () => {
        mockStorage[VISITOR_ID_KEY] = 'existing-id';

        service.trackEvent('info_page_view');

        expect(localStorage.setItem).not.toHaveBeenCalled();
        expect(mockHttp.post).toHaveBeenCalledWith(
            'http://localhost:5500/application/analytics/event',
            expect.objectContaining({ visitorId: 'existing-id', event: 'info_page_view' })
        );
    });

    it('should send value for duration events', () => {
        mockStorage[VISITOR_ID_KEY] = 'visitor-1';

        service.trackEvent('info_page_duration', 45.5);

        expect(mockHttp.post).toHaveBeenCalledWith(
            'http://localhost:5500/application/analytics/event',
            expect.objectContaining({ event: 'info_page_duration', value: 45.5 })
        );
    });

    it('should not throw when HTTP call fails', () => {
        mockStorage[VISITOR_ID_KEY] = 'visitor-1';
        mockHttp.post.mockReturnValue(throwError(() => new Error('Network error')));

        expect(() => service.trackEvent('info_page_view')).not.toThrow();
    });
});
