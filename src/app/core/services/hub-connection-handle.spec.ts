import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject } from 'rxjs';
import { HubConnectionHandle } from './hub-connection-handle';

describe('HubConnectionHandle', () => {
    let handle: HubConnectionHandle;
    let mockContainer: any;
    let reconnectEvent: Subject<void>;

    beforeEach(() => {
        reconnectEvent = new Subject<void>();
        mockContainer = {
            connection: {
                connectionId: 'test-connection-id',
                on: vi.fn(),
                off: vi.fn(),
                invoke: vi.fn().mockResolvedValue(undefined),
                stop: vi.fn()
            },
            reconnectEvent,
            connected: Promise.resolve(),
            dispose: vi.fn()
        };
        handle = new HubConnectionHandle(mockContainer);
    });

    describe('connectionId', () => {
        it('should return the connection id', () => {
            expect(handle.connectionId).toBe('test-connection-id');
        });

        it('should return null after disconnect', () => {
            handle.disconnect();
            expect(handle.connectionId).toBeNull();
        });
    });

    describe('on', () => {
        it('should register event handler on the connection', () => {
            const handler = vi.fn();
            handle.on('TestEvent', handler);
            expect(mockContainer.connection.on).toHaveBeenCalledWith('TestEvent', handler);
        });

        it('should not throw after disconnect', () => {
            handle.disconnect();
            expect(() => handle.on('TestEvent', vi.fn())).not.toThrow();
        });
    });

    describe('off', () => {
        it('should deregister event handler with callback', () => {
            const handler = vi.fn();
            handle.off('TestEvent', handler);
            expect(mockContainer.connection.off).toHaveBeenCalledWith('TestEvent', handler);
        });

        it('should deregister all handlers for event without callback', () => {
            handle.off('TestEvent');
            expect(mockContainer.connection.off).toHaveBeenCalledWith('TestEvent');
        });
    });

    describe('invoke', () => {
        it('should invoke method on the connection', async () => {
            mockContainer.connection.invoke.mockResolvedValue('result');
            const result = await handle.invoke('TestMethod', 'arg1', 'arg2');
            expect(mockContainer.connection.invoke).toHaveBeenCalledWith('TestMethod', 'arg1', 'arg2');
            expect(result).toBe('result');
        });

        it('should reject after disconnect', async () => {
            handle.disconnect();
            await expect(handle.invoke('TestMethod')).rejects.toThrow('Connection is disconnected');
        });
    });

    describe('reconnected$', () => {
        it('should emit when the container reconnects', () => {
            const callback = vi.fn();
            handle.reconnected$.subscribe(callback);

            reconnectEvent.next();

            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should not emit after disconnect', () => {
            const callback = vi.fn();
            handle.reconnected$.subscribe(callback);

            handle.disconnect();
            reconnectEvent.next();

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('disconnect', () => {
        it('should stop then dispose the container', () => {
            const callOrder: string[] = [];
            mockContainer.connection.stop.mockImplementation(() => callOrder.push('stop'));
            mockContainer.dispose.mockImplementation(() => callOrder.push('dispose'));

            handle.disconnect();

            expect(mockContainer.connection.stop).toHaveBeenCalled();
            expect(mockContainer.dispose).toHaveBeenCalled();
            expect(callOrder).toEqual(['stop', 'dispose']);
        });

        it('should be idempotent', () => {
            handle.disconnect();
            handle.disconnect();

            expect(mockContainer.dispose).toHaveBeenCalledTimes(1);
        });

        it('should complete reconnected$', () => {
            let completed = false;
            handle.reconnected$.subscribe({ complete: () => { completed = true; } });

            handle.disconnect();

            expect(completed).toBe(true);
        });
    });

    describe('connected', () => {
        it('should expose the container connected promise', () => {
            expect(handle.connected).toBe(mockContainer.connected);
        });
    });
});
