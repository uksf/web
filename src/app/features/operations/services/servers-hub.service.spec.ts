import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ServersHubService } from './servers-hub.service';
import { HubConnectionFactory } from '@app/core/services/hub-connection-factory';

describe('ServersHubService', () => {
    let service: ServersHubService;
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
                ServersHubService,
                { provide: HubConnectionFactory, useValue: mockFactory }
            ]
        });
        service = TestBed.inject(ServersHubService);
    });

    it('should connect to the servers endpoint', () => {
        service.connect();
        expect(mockFactory.connect).toHaveBeenCalledWith('servers');
    });
});
