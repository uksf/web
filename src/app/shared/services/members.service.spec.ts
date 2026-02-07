import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { MembersService } from './members.service';

describe('MembersService', () => {
    let service: MembersService;
    let httpClient: { get: ReturnType<typeof vi.fn> };
    let urls: { apiUrl: string };

    beforeEach(() => {
        httpClient = { get: vi.fn() };
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

    it('should get account by id', () => {
        const account = { id: '1', displayName: 'Test', unitAssignment: 'Unit1' };
        httpClient.get.mockReturnValue(of(account));

        service.getAccount('1').subscribe((result) => {
            expect(result).toBe(account);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/accounts/1');
    });
});
