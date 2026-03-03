import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AllHubService } from './all-hub.service';
import { HubConnectionFactory } from './hub-connection-factory';

describe('AllHubService', () => {
    let service: AllHubService;
    let mockFactory: any;

    beforeEach(() => {
        const reconnected$ = new Subject<void>();
        mockFactory = {
            connect: vi.fn().mockReturnValue({
                connected: Promise.resolve(),
                connectionId: 'test-id',
                reconnected$: reconnected$.asObservable(),
                on: vi.fn(),
                off: vi.fn(),
                invoke: vi.fn().mockResolvedValue(undefined),
                disconnect: vi.fn()
            })
        };

        TestBed.configureTestingModule({
            providers: [
                AllHubService,
                { provide: HubConnectionFactory, useValue: mockFactory }
            ]
        });
        service = TestBed.inject(AllHubService);
    });

    it('should connect to the all endpoint', () => {
        service.connect();
        expect(mockFactory.connect).toHaveBeenCalledWith('all');
    });
});
