import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { SignalRHubsService } from './signalr-hubs.service';
import { ConnectionContainer } from './signalr.service';

describe('SignalRHubsService', () => {
    let service: SignalRHubsService;
    let mockSignalRService: any;
    let mockAccountService: any;
    let mockConnection: any;
    let mockConnectionContainer: any;

    beforeEach(() => {
        mockConnection = {
            stop: vi.fn().mockResolvedValue(undefined),
            on: vi.fn(),
            off: vi.fn()
        };
        mockConnectionContainer = { connection: mockConnection, dispose: vi.fn() } as unknown as ConnectionContainer;

        mockSignalRService = {
            connect: vi.fn().mockReturnValue(mockConnectionContainer)
        };

        mockAccountService = {
            getAccount: vi.fn()
        };

        service = new SignalRHubsService(mockSignalRService, mockAccountService);
    });

    describe('getAllHub', () => {
        it('creates a new connection on first call', async () => {
            const hub = await service.getAllHub();

            expect(mockSignalRService.connect).toHaveBeenCalledWith('all');
            expect(hub).toBe(mockConnectionContainer);
        });

        it('returns the same connection on subsequent calls', async () => {
            const hub1 = await service.getAllHub();
            const hub2 = await service.getAllHub();

            expect(mockSignalRService.connect).toHaveBeenCalledTimes(1);
            expect(hub1).toBe(hub2);
        });
    });

    describe('getAccountGroupedHub', () => {
        it('creates a connection with account id on first call', async () => {
            const mockAccount = { id: 'test-account-id' };
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));

            const hub = await service.getAccountGroupedHub();

            expect(mockSignalRService.connect).toHaveBeenCalledWith('accountGrouped?userId=test-account-id');
            expect(hub).toBe(mockConnectionContainer);
        });

        it('returns the same connection on subsequent calls', async () => {
            const mockAccount = { id: 'test-account-id' };
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));

            const hub1 = await service.getAccountGroupedHub();
            const hub2 = await service.getAccountGroupedHub();

            expect(mockSignalRService.connect).toHaveBeenCalledTimes(1);
            expect(hub1).toBe(hub2);
        });

        it('rejects when account service fails', async () => {
            mockAccountService.getAccount.mockReturnValue(throwError(() => new Error('fail')));

            await expect(service.getAccountGroupedHub()).rejects.toBeUndefined();
        });
    });

    describe('disconnect', () => {
        it('stops allHubConnection when it exists', async () => {
            await service.getAllHub();

            await service.disconnect();

            expect(mockConnection.stop).toHaveBeenCalled();
        });

        it('stops accountGroupedHubConnection when it exists', async () => {
            const mockAccount = { id: 'test-id' };
            mockAccountService.getAccount.mockReturnValue(of(mockAccount));

            await service.getAccountGroupedHub();

            await service.disconnect();

            expect(mockConnection.stop).toHaveBeenCalled();
        });

        it('clears connection references after stopping', async () => {
            await service.getAllHub();

            await service.disconnect();

            // After disconnect, getAllHub should create a new connection
            mockSignalRService.connect.mockClear();
            await service.getAllHub();
            expect(mockSignalRService.connect).toHaveBeenCalledTimes(1);
        });

        it('does nothing when no connections exist', async () => {
            await service.disconnect();

            expect(mockConnection.stop).not.toHaveBeenCalled();
        });
    });
});
