import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignalRService, ConnectionContainer } from './signalr.service';

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
        service = new SignalRService(mockUrls, mockSessionService);
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

            // Simulate a reconnection interval being set
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
