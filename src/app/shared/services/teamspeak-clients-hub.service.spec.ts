import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TeamspeakClientsHubService } from './teamspeak-clients-hub.service';
import { HubConnectionFactory } from '@app/core/services/hub-connection-factory';

describe('TeamspeakClientsHubService', () => {
    let service: TeamspeakClientsHubService;
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
                TeamspeakClientsHubService,
                { provide: HubConnectionFactory, useValue: mockFactory }
            ]
        });
        service = TestBed.inject(TeamspeakClientsHubService);
    });

    it('should connect to the teamspeakClients endpoint', () => {
        service.connect();
        expect(mockFactory.connect).toHaveBeenCalledWith('teamspeakClients');
    });
});
