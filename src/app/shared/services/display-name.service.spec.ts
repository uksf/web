import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisplayNameService } from './display-name.service';
import { of, throwError } from 'rxjs';

describe('DisplayNameService', () => {
    let service: DisplayNameService;
    let httpClient: { get: ReturnType<typeof vi.fn> };
    let urlService: { apiUrl: string };

    beforeEach(() => {
        httpClient = { get: vi.fn() };
        urlService = { apiUrl: 'http://localhost:5500/api' };
        service = new DisplayNameService(httpClient as any, urlService as any);
    });

    it('should resolve with name when API returns a name', async () => {
        httpClient.get.mockReturnValue(of('John Doe'));
        const name = await service.getName('abc123');
        expect(name).toBe('John Doe');
        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/api/displayName/abc123', { responseType: 'text' });
    });

    it('should reject when id is empty', async () => {
        await expect(service.getName('')).rejects.toBeUndefined();
        expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should reject when id is null', async () => {
        await expect(service.getName(null)).rejects.toBeUndefined();
        expect(httpClient.get).not.toHaveBeenCalled();
    });

    it('should reject when API returns empty name', async () => {
        httpClient.get.mockReturnValue(of(''));
        await expect(service.getName('abc123')).rejects.toBeUndefined();
    });

    it('should reject when API returns error', async () => {
        httpClient.get.mockReturnValue(throwError(() => new Error('Not found')));
        await expect(service.getName('abc123')).rejects.toBeUndefined();
    });
});
