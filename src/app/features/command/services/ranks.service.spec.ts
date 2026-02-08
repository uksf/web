import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RanksService } from './ranks.service';
import { of } from 'rxjs';
import { Rank } from '@app/shared/models/rank';

describe('RanksService', () => {
    let service: RanksService;
    let mockHttpClient: any;
    let mockUrls: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of([])),
            post: vi.fn().mockReturnValue(of({})),
            patch: vi.fn().mockReturnValue(of([])),
            delete: vi.fn().mockReturnValue(of([]))
        };
        mockUrls = { apiUrl: 'http://localhost:5500' };
        service = new RanksService(mockHttpClient, mockUrls);
    });

    it('getRanks calls GET /ranks', () => {
        const ranks = [{ name: 'Private' }] as Rank[];
        mockHttpClient.get.mockReturnValue(of(ranks));

        service.getRanks().subscribe({
            next: (result) => expect(result).toEqual(ranks)
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/ranks');
    });

    it('checkRankExists calls POST /ranks/exists with JSON headers', () => {
        const rank = { name: 'Private' } as Rank;
        const existingRank = { name: 'Private' } as Rank;
        mockHttpClient.post.mockReturnValue(of(existingRank));

        service.checkRankExists(rank).subscribe({
            next: (result) => expect(result).toEqual(existingRank)
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/ranks/exists',
            rank,
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('editRank calls PATCH /ranks with JSON headers', () => {
        const rank = { name: 'Corporal' } as Rank;
        mockHttpClient.patch.mockReturnValue(of([rank]));

        service.editRank(rank).subscribe();

        expect(mockHttpClient.patch).toHaveBeenCalledWith(
            'http://localhost:5500/ranks',
            rank,
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('deleteRank calls DELETE /ranks/:id', () => {
        mockHttpClient.delete.mockReturnValue(of([]));

        service.deleteRank('rank-123').subscribe({
            next: (result) => expect(result).toEqual([])
        });

        expect(mockHttpClient.delete).toHaveBeenCalledWith('http://localhost:5500/ranks/rank-123');
    });

    it('addRank calls POST /ranks with JSON headers', () => {
        const formJson = '{"name":"Sergeant"}';

        service.addRank(formJson).subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/ranks',
            formJson,
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('checkRankName calls POST /ranks/:name with empty body', () => {
        const existingRank = { name: 'Private' } as Rank;
        mockHttpClient.post.mockReturnValue(of(existingRank));

        service.checkRankName('Private').subscribe({
            next: (result) => expect(result).toEqual(existingRank)
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/ranks/Private', {});
    });

    it('updateRankOrder calls POST /ranks/order', () => {
        const ranks = [{ name: 'Private' }, { name: 'Corporal' }] as Rank[];
        mockHttpClient.post.mockReturnValue(of(ranks));

        service.updateRankOrder(ranks).subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5500/ranks/order', ranks);
    });
});
