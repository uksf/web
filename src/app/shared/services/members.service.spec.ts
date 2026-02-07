import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { MembersService } from './members.service';

describe('MembersService', () => {
    let service: MembersService;
    let httpClient: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
    let urls: { apiUrl: string };

    beforeEach(() => {
        httpClient = { get: vi.fn(), put: vi.fn() };
        urls = { apiUrl: 'http://localhost:5500' };
        service = new MembersService(httpClient as any, urls as any);
    });

    it('should get members', () => {
        const members = [{ id: '1', displayName: 'Test' }];
        httpClient.get.mockReturnValue(of(members));

        service.getMembers().subscribe((result) => {
            expect(result).toBe(members);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/accounts/members');
    });

    it('should get members reversed', () => {
        const members = [{ id: '1', displayName: 'Test' }];
        httpClient.get.mockReturnValue(of(members));

        service.getMembers(true).subscribe((result) => {
            expect(result).toBe(members);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/accounts/members?reverse=true');
    });

    it('should get account by id', () => {
        const account = { id: '1', displayName: 'Test', unitAssignment: 'Unit1' };
        httpClient.get.mockReturnValue(of(account));

        service.getAccount('1').subscribe((result) => {
            expect(result).toBe(account);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/accounts/1');
    });

    it('should get roster', () => {
        const roster = [{ id: '1', name: 'Test' }];
        httpClient.get.mockReturnValue(of(roster));

        service.getRoster().subscribe((result) => {
            expect(result).toBe(roster);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/accounts/roster');
    });

    it('should get command members with params', () => {
        const { HttpParams } = require('@angular/common/http');
        const params = new HttpParams().set('page', '1').set('pageSize', '15');
        const pagedResult = { data: [], totalCount: 0 };
        httpClient.get.mockReturnValue(of(pagedResult));

        service.getCommandMembers(params).subscribe((result) => {
            expect(result).toBe(pagedResult);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/command/members', { params });
    });

    it('should update qualifications', () => {
        httpClient.put.mockReturnValue(of(undefined));
        const qualifications = ['q1', 'q2'];

        service.updateQualifications('acc1', qualifications).subscribe();

        expect(httpClient.put).toHaveBeenCalledWith('http://localhost:5500/accounts/acc1/qualifications', qualifications);
    });
});
