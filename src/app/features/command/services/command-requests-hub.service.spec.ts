import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CommandRequestsHubService } from './command-requests-hub.service';
import { HubConnectionFactory } from '@app/core/services/hub-connection-factory';

describe('CommandRequestsHubService', () => {
    let service: CommandRequestsHubService;
    let mockFactory: any;

    beforeEach(() => {
        mockFactory = {
            connect: vi.fn().mockReturnValue({
                connected: Promise.resolve(),
                connectionId: 'test-id',
                reconnected$: new Subject<void>().asObservable(),
                on: vi.fn(),
                off: vi.fn(),
                invoke: vi.fn().mockResolvedValue(undefined),
                disconnect: vi.fn()
            })
        };

        TestBed.configureTestingModule({
            providers: [
                CommandRequestsHubService,
                { provide: HubConnectionFactory, useValue: mockFactory }
            ]
        });
        service = TestBed.inject(CommandRequestsHubService);
    });

    it('should connect to the commandRequests endpoint', () => {
        service.connect();
        expect(mockFactory.connect).toHaveBeenCalledWith('commandRequests');
    });
});
