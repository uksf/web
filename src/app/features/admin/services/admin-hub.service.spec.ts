import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AdminHubService } from './admin-hub.service';
import { HubConnectionFactory } from '@app/core/services/hub-connection-factory';

describe('AdminHubService', () => {
    let service: AdminHubService;
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
                AdminHubService,
                { provide: HubConnectionFactory, useValue: mockFactory }
            ]
        });
        service = TestBed.inject(AdminHubService);
    });

    it('should connect to the admin endpoint', () => {
        service.connect();
        expect(mockFactory.connect).toHaveBeenCalledWith('admin');
    });
});
