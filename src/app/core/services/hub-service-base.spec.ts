import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HubServiceBase } from './hub-service-base';
import { HubConnectionFactory } from './hub-connection-factory';

@Injectable()
class TestHubService extends HubServiceBase {
    protected readonly endpoint = 'test-endpoint';
}

describe('HubServiceBase', () => {
    let service: TestHubService;
    let mockFactory: any;
    let mockHandle: any;
    let reconnected$: Subject<void>;

    function createMockHandle(): any {
        reconnected$ = new Subject<void>();
        return {
            connected: Promise.resolve(),
            connectionId: 'test-id',
            reconnected$: reconnected$.asObservable(),
            on: vi.fn(),
            off: vi.fn(),
            invoke: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn()
        };
    }

    beforeEach(() => {
        mockHandle = createMockHandle();
        mockFactory = {
            connect: vi.fn().mockReturnValue(mockHandle)
        };

        TestBed.configureTestingModule({
            providers: [
                TestHubService,
                { provide: HubConnectionFactory, useValue: mockFactory }
            ]
        });
        service = TestBed.inject(TestHubService);
    });

    describe('connect', () => {
        it('should create a connection via the factory', () => {
            service.connect();
            expect(mockFactory.connect).toHaveBeenCalledWith('test-endpoint');
        });

        it('should not create a second connection on repeated calls', () => {
            service.connect();
            service.connect();
            expect(mockFactory.connect).toHaveBeenCalledTimes(1);
        });
    });

    describe('disconnect', () => {
        it('should disconnect after all refs are released', () => {
            service.connect();
            service.connect();
            service.disconnect();
            expect(mockHandle.disconnect).not.toHaveBeenCalled();
            service.disconnect();
            expect(mockHandle.disconnect).toHaveBeenCalled();
        });

        it('should do nothing when not connected', () => {
            service.disconnect();
            expect(mockHandle.disconnect).not.toHaveBeenCalled();
        });

        it('should allow reconnection after full disconnect', () => {
            service.connect();
            service.disconnect();
            mockFactory.connect.mockClear();
            service.connect();
            expect(mockFactory.connect).toHaveBeenCalledTimes(1);
        });

        it('should not leak reconnected$ subscriptions across disconnect/connect cycles', () => {
            service.connect();
            const callback = vi.fn();
            service.reconnected$.subscribe(callback);

            service.disconnect();

            // Create a new handle for the second connection
            const reconnected2$ = new Subject<void>();
            const mockHandle2: any = {
                connected: Promise.resolve(),
                connectionId: 'test-id-2',
                reconnected$: reconnected2$.asObservable(),
                on: vi.fn(),
                off: vi.fn(),
                invoke: vi.fn().mockResolvedValue(undefined),
                disconnect: vi.fn()
            };
            mockFactory.connect.mockReturnValue(mockHandle2);

            service.connect();

            // Old reconnected$ should not fire through to the service
            reconnected$.next();
            expect(callback).not.toHaveBeenCalled();

            // New reconnected$ should fire
            reconnected2$.next();
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('ref counting', () => {
        it('should not go below zero', () => {
            service.disconnect();
            service.disconnect();
            service.connect();
            service.disconnect();
            expect(mockHandle.disconnect).toHaveBeenCalled();
        });
    });

    describe('reconnected$', () => {
        it('should emit when the handle reconnects', () => {
            service.connect();
            const callback = vi.fn();
            service.reconnected$.subscribe(callback);

            reconnected$.next();

            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('on/off', () => {
        it('should delegate to the handle', () => {
            service.connect();
            const handler = vi.fn();
            service.on('Event', handler);
            expect(mockHandle.on).toHaveBeenCalledWith('Event', handler);
            service.off('Event', handler);
            expect(mockHandle.off).toHaveBeenCalledWith('Event', handler);
        });

        it('should not throw when not connected', () => {
            expect(() => service.on('Event', vi.fn())).not.toThrow();
            expect(() => service.off('Event', vi.fn())).not.toThrow();
        });
    });

    describe('invoke', () => {
        it('should delegate to the handle', async () => {
            service.connect();
            await service.invoke('Method', 'arg');
            expect(mockHandle.invoke).toHaveBeenCalledWith('Method', 'arg');
        });

        it('should reject when not connected', async () => {
            await expect(service.invoke('Method')).rejects.toThrow('Not connected');
        });
    });

    describe('connectionId', () => {
        it('should return the handle connection id', () => {
            service.connect();
            expect(service.connectionId).toBe('test-id');
        });

        it('should return null when not connected', () => {
            expect(service.connectionId).toBeNull();
        });
    });

    describe('ngOnDestroy', () => {
        it('should disconnect and complete reconnected$', () => {
            service.connect();
            let completed = false;
            service.reconnected$.subscribe({ complete: () => { completed = true; } });

            service.ngOnDestroy();

            expect(completed).toBe(true);
            expect(mockHandle.disconnect).toHaveBeenCalled();
        });
    });
});
