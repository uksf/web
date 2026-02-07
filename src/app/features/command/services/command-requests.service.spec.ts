import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { CommandRequestsService } from './command-requests.service';

describe('CommandRequestsService', () => {
    let service: CommandRequestsService;
    let httpClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> };
    let urls: { apiUrl: string };

    beforeEach(() => {
        httpClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn() };
        urls = { apiUrl: 'http://localhost:5500' };
        service = new CommandRequestsService(httpClient as any, urls as any);
    });

    it('should get requests', () => {
        const response = { myRequests: [], otherRequests: [] };
        httpClient.get.mockReturnValue(of(response));

        service.getRequests().subscribe((result) => {
            expect(result).toBe(response);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/commandrequests');
    });

    it('should set review', () => {
        httpClient.patch.mockReturnValue(of(null));

        service.setReview('req1', 0, false).subscribe();

        expect(httpClient.patch).toHaveBeenCalledWith(
            'http://localhost:5500/commandrequests/req1',
            { reviewState: 0, overriden: false },
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
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

    it('should create rank request', () => {
        httpClient.post.mockReturnValue(of(null));
        const request = { recipient: 'r1', value: 'v1', reason: 'test' };

        service.createRank(request).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/commandrequests/create/rank', request);
    });

    it('should create discharge request', () => {
        httpClient.post.mockReturnValue(of(null));
        const request = { recipient: 'r1', reason: 'test' };

        service.createDischarge(request).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/commandrequests/create/discharge', request);
    });

    it('should create chain of command position request', () => {
        httpClient.post.mockReturnValue(of(null));
        const request = { recipient: 'r1', value: 'v1', secondaryValue: 's1', reason: 'test' };

        service.createChainOfCommandPosition(request).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/commandrequests/create/chainofcommandposition', request);
    });

    it('should create reinstate request', () => {
        httpClient.post.mockReturnValue(of(null));
        const request = { recipient: 'r1', reason: 'test' };

        service.createReinstate(request).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/commandrequests/create/reinstate',
            JSON.stringify(request),
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('should create loa request', () => {
        httpClient.post.mockReturnValue(of(null));
        const body = { reason: 'test', start: '2024-01-01', end: '2024-01-07', emergency: false, late: false };

        service.createLoa(body).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/commandrequests/create/loa',
            body,
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('should check if request exists', () => {
        httpClient.post.mockReturnValue(of(true));
        const body = { recipient: 'r1', type: 'Reinstate Member', displayValue: 'Member', displayFrom: 'Discharged' };

        service.checkExists(body).subscribe((result) => {
            expect(result).toBe(true);
        });

        expect(httpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/commandrequests/exists',
            JSON.stringify(body),
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });
});
