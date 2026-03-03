import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { HubConnectionFactory } from './hub-connection-factory';
import { SignalRService } from './signalr.service';
import { HubConnectionHandle } from './hub-connection-handle';

describe('HubConnectionFactory', () => {
    let factory: HubConnectionFactory;
    let mockSignalR: any;
    let mockContainer: any;

    beforeEach(() => {
        mockContainer = {
            connection: { stop: vi.fn(), on: vi.fn(), off: vi.fn(), connectionId: 'test-id' },
            reconnectEvent: new Subject<void>(),
            connected: Promise.resolve(),
            dispose: vi.fn()
        };
        mockSignalR = {
            connect: vi.fn().mockReturnValue(mockContainer)
        };

        TestBed.configureTestingModule({
            providers: [
                HubConnectionFactory,
                { provide: SignalRService, useValue: mockSignalR }
            ]
        });
        factory = TestBed.inject(HubConnectionFactory);
    });

    describe('connect', () => {
        it('should call SignalRService.connect with the endpoint', () => {
            factory.connect('test-endpoint');
            expect(mockSignalR.connect).toHaveBeenCalledWith('test-endpoint');
        });

        it('should return a HubConnectionHandle', () => {
            const handle = factory.connect('test-endpoint');
            expect(handle).toBeInstanceOf(HubConnectionHandle);
        });

        it('should create separate handles for each call', () => {
            const handle1 = factory.connect('endpoint1');
            const handle2 = factory.connect('endpoint2');
            expect(handle1).not.toBe(handle2);
            expect(mockSignalR.connect).toHaveBeenCalledTimes(2);
        });
    });
});
