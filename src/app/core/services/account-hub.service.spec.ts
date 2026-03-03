import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AccountHubService } from './account-hub.service';
import { HubConnectionFactory } from './hub-connection-factory';
import { AccountService } from './account.service';

describe('AccountHubService', () => {
    let service: AccountHubService;
    let mockFactory: any;
    let mockAccountService: any;
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
        mockAccountService = {
            account: { id: 'user-123' },
            accountChange$: new Subject()
        };

        TestBed.configureTestingModule({
            providers: [
                AccountHubService,
                { provide: HubConnectionFactory, useValue: mockFactory },
                { provide: AccountService, useValue: mockAccountService }
            ]
        });
        service = TestBed.inject(AccountHubService);
    });

    describe('connect', () => {
        it('should connect with account id when available', async () => {
            service.connect();
            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalledWith('account?userId=user-123');
            });
        });

        it('should wait for account id when not immediately available', async () => {
            mockAccountService.account = null;
            service.connect();

            expect(mockFactory.connect).not.toHaveBeenCalled();

            mockAccountService.accountChange$.next({ id: 'delayed-user' });

            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalledWith('account?userId=delayed-user');
            });
        });

        it('should disconnect previous connection before reconnecting', async () => {
            service.connect();
            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalledTimes(1);
            });

            service.connect();
            expect(mockHandle.disconnect).toHaveBeenCalled();
        });

        it('should cancel pending connect when connect() called again quickly', async () => {
            mockAccountService.account = null;
            service.connect();

            // Call connect again before the first resolves
            mockAccountService.account = { id: 'user-456' };
            const handle2 = createMockHandle();
            mockFactory.connect.mockReturnValue(handle2);
            service.connect();

            // Now resolve the first waitForId
            mockAccountService.accountChange$.next({ id: 'user-123' });

            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalledTimes(1);
            });

            // Only the second connect should have gone through
            expect(mockFactory.connect).toHaveBeenCalledWith('account?userId=user-456');
        });
    });

    describe('disconnect', () => {
        it('should disconnect the handle', async () => {
            service.connect();
            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalled();
            });

            service.disconnect();
            expect(mockHandle.disconnect).toHaveBeenCalled();
        });

        it('should do nothing when not connected', () => {
            service.disconnect();
            expect(mockHandle.disconnect).not.toHaveBeenCalled();
        });

        it('should not leak reconnected$ subscriptions', async () => {
            service.connect();
            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalled();
            });

            const callback = vi.fn();
            service.reconnected$.subscribe(callback);

            service.disconnect();

            // Emitting on old reconnected$ should not propagate
            reconnected$.next();
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('reconnected$', () => {
        it('should emit when the connection reconnects', async () => {
            service.connect();
            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalled();
            });

            const callback = vi.fn();
            service.reconnected$.subscribe(callback);
            reconnected$.next();

            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('on/off', () => {
        it('should delegate to the handle when connected', async () => {
            service.connect();
            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalled();
            });

            const handler = vi.fn();
            service.on('Event', handler);
            expect(mockHandle.on).toHaveBeenCalledWith('Event', handler);

            service.off('Event', handler);
            expect(mockHandle.off).toHaveBeenCalledWith('Event', handler);
        });

        it('should queue on() calls and apply when handle becomes available', async () => {
            const handler = vi.fn();
            service.connect();
            // on() called before async connect completes
            service.on('ReceiveAccountUpdate', handler);

            expect(mockHandle.on).not.toHaveBeenCalled();

            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalled();
            });

            expect(mockHandle.on).toHaveBeenCalledWith('ReceiveAccountUpdate', handler);
        });

        it('should remove queued handler via off() before connect completes', async () => {
            const handler = vi.fn();
            mockAccountService.account = null;
            service.connect();
            service.on('Event', handler);
            service.off('Event', handler);

            mockAccountService.account = { id: 'user-123' };
            mockAccountService.accountChange$.next({ id: 'user-123' });

            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalled();
            });

            expect(mockHandle.on).not.toHaveBeenCalled();
        });
    });

    describe('ngOnDestroy', () => {
        it('should disconnect and complete reconnected$', async () => {
            service.connect();
            await vi.waitFor(() => {
                expect(mockFactory.connect).toHaveBeenCalled();
            });

            let completed = false;
            service.reconnected$.subscribe({ complete: () => { completed = true; } });

            service.ngOnDestroy();

            expect(completed).toBe(true);
            expect(mockHandle.disconnect).toHaveBeenCalled();
        });
    });
});
