import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkshopService } from './workshop.service';
import { of } from 'rxjs';
import { WorkshopMod, WorkshopModUpdatedDate } from '../models/workshop-mod';

describe('WorkshopService', () => {
    let service: WorkshopService;
    let mockHttpClient: any;
    let mockUrls: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of({})),
            post: vi.fn().mockReturnValue(of({})),
            delete: vi.fn().mockReturnValue(of({}))
        };
        mockUrls = { apiUrl: 'http://localhost:5500' };
        service = new WorkshopService(mockHttpClient, mockUrls);
    });

    it('getMods calls GET /workshop', () => {
        const mods: WorkshopMod[] = [];
        mockHttpClient.get.mockReturnValue(of(mods));

        service.getMods().subscribe({
            next: (result) => expect(result).toEqual(mods)
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/workshop');
    });

    it('getMod calls GET /workshop/:id', () => {
        const mod = { id: 'mod1', steamId: '123' } as WorkshopMod;
        mockHttpClient.get.mockReturnValue(of(mod));

        service.getMod('mod1').subscribe({
            next: (result) => expect(result.id).toBe('mod1')
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/workshop/mod1');
    });

    it('getModUpdatedDate calls GET /workshop/:steamId/updatedDate', () => {
        const response: WorkshopModUpdatedDate = { updatedDate: '2026-01-01T00:00:00Z' };
        mockHttpClient.get.mockReturnValue(of(response));

        service.getModUpdatedDate('123').subscribe({
            next: (result) => expect(result.updatedDate).toBe('2026-01-01T00:00:00Z')
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/workshop/123/updatedDate');
    });

    it('installMod calls POST /workshop with mod data', () => {
        const data = { steamId: '123', rootMod: true, folderName: 'test' };

        service.installMod(data).subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/workshop',
            { steamId: '123', rootMod: true, folderName: 'test' }
        );
    });

    it('resolveIntervention calls POST /workshop/:steamId/resolve', () => {
        service.resolveIntervention('123', ['pbo1', 'pbo2']).subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/workshop/123/resolve',
            { selectedPbos: ['pbo1', 'pbo2'] }
        );
    });

    it('updateMod calls POST /workshop/:steamId/update', () => {
        service.updateMod('123').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/workshop/123/update',
            {}
        );
    });

    it('uninstallMod calls POST /workshop/:steamId/uninstall', () => {
        service.uninstallMod('123').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/workshop/123/uninstall',
            {}
        );
    });

    it('deleteMod calls DELETE /workshop/:steamId', () => {
        service.deleteMod('123').subscribe();

        expect(mockHttpClient.delete).toHaveBeenCalledWith('http://localhost:5500/workshop/123');
    });
});
