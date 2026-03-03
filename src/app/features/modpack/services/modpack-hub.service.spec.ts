import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ModpackHubService } from './modpack-hub.service';
import { HubConnectionFactory } from '@app/core/services/hub-connection-factory';

describe('ModpackHubService', () => {
    let service: ModpackHubService;
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
                ModpackHubService,
                { provide: HubConnectionFactory, useValue: mockFactory }
            ]
        });
        service = TestBed.inject(ModpackHubService);
    });

    it('should connect to the modpack endpoint', () => {
        service.connect();
        expect(mockFactory.connect).toHaveBeenCalledWith('modpack');
    });
});
