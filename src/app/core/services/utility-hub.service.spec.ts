import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { UtilityHubService } from './utility-hub.service';
import { HubConnectionFactory } from './hub-connection-factory';

describe('UtilityHubService', () => {
    let service: UtilityHubService;
    let mockFactory: any;
    let mockHandle: any;
    let reconnected$: Subject<void>;

    beforeEach(() => {
        reconnected$ = new Subject<void>();
        mockHandle = {
            connected: Promise.resolve(),
            connectionId: 'test-id',
            reconnected$: reconnected$.asObservable(),
            on: vi.fn(),
            off: vi.fn(),
            invoke: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn()
        };
        mockFactory = {
            connect: vi.fn().mockReturnValue(mockHandle)
        };

        TestBed.configureTestingModule({
            providers: [
                UtilityHubService,
                { provide: HubConnectionFactory, useValue: mockFactory }
            ]
        });
        service = TestBed.inject(UtilityHubService);
    });

    describe('connect', () => {
        it('should create a connection to the utility endpoint', () => {
            service.connect();
            expect(mockFactory.connect).toHaveBeenCalledWith('utility');
        });

        it('should not create a second connection if already connected', () => {
            service.connect();
            service.connect();
            expect(mockFactory.connect).toHaveBeenCalledTimes(1);
        });
    });

    describe('disconnect', () => {
        it('should disconnect the handle', () => {
            service.connect();
            service.disconnect();
            expect(mockHandle.disconnect).toHaveBeenCalled();
        });

        it('should do nothing if not connected', () => {
            service.disconnect();
            expect(mockHandle.disconnect).not.toHaveBeenCalled();
        });
    });

    describe('reconnected$', () => {
        it('should emit when the connection reconnects', () => {
            service.connect();
            const callback = vi.fn();
            service.reconnected$.subscribe(callback);

            reconnected$.next();

            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should not emit after destroy', () => {
            service.connect();
            const callback = vi.fn();
            service.reconnected$.subscribe(callback);

            service.ngOnDestroy();
            reconnected$.next();

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('on', () => {
        it('should register a handler on the hub connection', () => {
            service.connect();
            const handler = vi.fn();

            service.on('TestEvent', handler);

            expect(mockHandle.on).toHaveBeenCalledWith('TestEvent', handler);
        });

        it('should not throw when not connected', () => {
            expect(() => service.on('TestEvent', vi.fn())).not.toThrow();
        });
    });

    describe('off', () => {
        it('should deregister a handler from the hub connection', () => {
            service.connect();
            const handler = vi.fn();

            service.off('TestEvent', handler);

            expect(mockHandle.off).toHaveBeenCalledWith('TestEvent', handler);
        });

        it('should not throw when not connected', () => {
            expect(() => service.off('TestEvent', vi.fn())).not.toThrow();
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
