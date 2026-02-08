import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { InfrastructureService } from './infrastructure.service';
import type { ServerInfrastructureCurrent, ServerInfrastructureInstalled, ServerInfrastructureLatest, ServerInfrastructureUpdate } from '@app/shared/models/server-infrastructure';

describe('InfrastructureService', () => {
    let service: InfrastructureService;
    let httpClient: { get: ReturnType<typeof vi.fn> };
    let urls: { apiUrl: string };

    beforeEach(() => {
        httpClient = { get: vi.fn() };
        urls = { apiUrl: 'http://localhost:5500' };
        service = new InfrastructureService(httpClient as any, urls as any);
    });

    it('should call isUpdating endpoint', () => {
        httpClient.get.mockReturnValue(of(true));

        service.isUpdating().subscribe((result) => {
            expect(result).toBe(true);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/servers/infrastructure/isUpdating');
    });

    it('should call getLatest endpoint', () => {
        const latest: ServerInfrastructureLatest = { latestBuild: '123', latestUpdate: new Date() };
        httpClient.get.mockReturnValue(of(latest));

        service.getLatest().subscribe((result) => {
            expect(result).toBe(latest);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/servers/infrastructure/latest');
    });

    it('should call getCurrent endpoint', () => {
        const current: ServerInfrastructureCurrent = { currentBuild: '123', currentUpdated: new Date() };
        httpClient.get.mockReturnValue(of(current));

        service.getCurrent().subscribe((result) => {
            expect(result).toBe(current);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/servers/infrastructure/current');
    });

    it('should call getInstalled endpoint', () => {
        const installed: ServerInfrastructureInstalled = { installedVersion: '2.18', installedLastModified: new Date() };
        httpClient.get.mockReturnValue(of(installed));

        service.getInstalled().subscribe((result) => {
            expect(result).toBe(installed);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/servers/infrastructure/installed');
    });

    it('should call update endpoint', () => {
        const updateResult: ServerInfrastructureUpdate = { newVersion: '2.20', updateOutput: 'Success' };
        httpClient.get.mockReturnValue(of(updateResult));

        service.update().subscribe((result) => {
            expect(result).toBe(updateResult);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/servers/infrastructure/update');
    });
});
