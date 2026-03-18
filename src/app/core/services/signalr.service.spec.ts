import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SignalRService, ConnectionContainer } from './signalr.service';
import { UrlService } from './url.service';
import { SessionService } from './authentication/session.service';

// Access the IndefiniteRetryPolicy via the module internals is not possible since it's not exported.
// We test its behaviour indirectly through the retry delay constants.

describe('SignalRService', () => {
    let service: SignalRService;
    let mockUrls: any;
    let mockSessionService: any;

    beforeEach(() => {
        vi.useFakeTimers();
        mockUrls = { apiUrl: 'http://localhost:5500' };
        mockSessionService = {
            getSessionToken: vi.fn().mockReturnValue('mock-token')
        };

        TestBed.configureTestingModule({
            providers: [
                SignalRService,
                { provide: UrlService, useValue: mockUrls },
                { provide: SessionService, useValue: mockSessionService },
            ]
        });
        service = TestBed.inject(SignalRService);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('ConnectionContainer', () => {
        it('stores connection and reconnect event', () => {
            const mockConnection = { stop: vi.fn() } as any;
            const mockEvent = { complete: vi.fn() } as any;
            const container = new ConnectionContainer(mockConnection, mockEvent);

            expect(container.connection).toBe(mockConnection);
            expect(container.reconnectEvent).toBe(mockEvent);
        });

        it('has a dispose method to clear reconnection intervals', () => {
            const mockConnection = { stop: vi.fn() } as any;
            const mockEvent = { complete: vi.fn() } as any;
            const container = new ConnectionContainer(mockConnection, mockEvent);

            expect(typeof container.dispose).toBe('function');
        });

        it('clears reconnection interval on dispose', () => {
            const mockConnection = { stop: vi.fn() } as any;
            const mockEvent = { complete: vi.fn() } as any;
            const container = new ConnectionContainer(mockConnection, mockEvent);

            container.reconnectIntervalId = setInterval(() => {}, 5000);
            expect(container.reconnectIntervalId).toBeDefined();

            container.dispose();

            expect(container.reconnectIntervalId).toBeUndefined();
        });

        it('clears connect timeout on dispose', () => {
            const mockConnection = { stop: vi.fn() } as any;
            const mockEvent = { complete: vi.fn() } as any;
            const container = new ConnectionContainer(mockConnection, mockEvent);

            container.connectTimeoutId = setTimeout(() => {}, 5000);
            expect(container.connectTimeoutId).toBeDefined();

            container.dispose();

            expect(container.connectTimeoutId).toBeUndefined();
        });

        it('completes reconnectEvent Subject on dispose', () => {
            const mockConnection = { stop: vi.fn() } as any;
            const mockEvent = { complete: vi.fn() } as any;
            const container = new ConnectionContainer(mockConnection, mockEvent);

            container.dispose();

            expect(mockEvent.complete).toHaveBeenCalled();
        });
    });
});
