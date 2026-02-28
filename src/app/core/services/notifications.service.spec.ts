import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { NotificationsService } from './notifications.service';
import { UrlService } from './url.service';
import { of } from 'rxjs';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of([])),
            post: vi.fn().mockReturnValue(of(null)),
        };
        TestBed.configureTestingModule({
            providers: [
                NotificationsService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } },
            ]
        });
        service = TestBed.inject(NotificationsService);
    });

    it('getNotifications calls correct endpoint', () => {
        service.getNotifications().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/notifications');
    });

    it('markRead calls correct endpoint', () => {
        const notifications = [{ id: '1' }] as any;
        service.markRead(notifications).subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/notifications/read', { notifications });
    });

    it('clear calls correct endpoint', () => {
        const notifications = [{ id: '1' }] as any;
        service.clear(notifications).subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/notifications/clear', { notifications });
    });
});
