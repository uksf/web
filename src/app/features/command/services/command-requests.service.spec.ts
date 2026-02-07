import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { CommandRequestsService } from './command-requests.service';

describe('CommandRequestsService', () => {
    let service: CommandRequestsService;
    let httpClient: { post: ReturnType<typeof vi.fn> };
    let urls: { apiUrl: string };

    beforeEach(() => {
        httpClient = { post: vi.fn() };
        urls = { apiUrl: 'http://localhost:5500' };
        service = new CommandRequestsService(httpClient as any, urls as any);
    });

    it('should create transfer request', () => {
        httpClient.post.mockReturnValue(of(null));
        const request = { recipient: 'r1', value: 'v1', reason: 'test' };

        service.createTransfer(request).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/commandrequests/create/transfer', request);
    });

    it('should create unit removal request', () => {
        httpClient.post.mockReturnValue(of(null));
        const request = { recipient: 'r1', value: 'v1', reason: 'test' };

        service.createUnitRemoval(request).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/commandrequests/create/unitremoval', request);
    });

    it('should create role request', () => {
        httpClient.post.mockReturnValue(of(null));
        const request = { recipient: 'r1', value: 'v1', reason: 'test' };

        service.createRole(request).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/commandrequests/create/role', request);
    });

    it('should create chain of command position request', () => {
        httpClient.post.mockReturnValue(of(null));
        const request = { recipient: 'r1', value: 'v1', secondaryValue: 's1', reason: 'test' };

        service.createChainOfCommandPosition(request).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/commandrequests/create/chainofcommandposition', request);
    });
});
