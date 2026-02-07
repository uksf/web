import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { AdminToolsService } from './admin-tools.service';

describe('AdminToolsService', () => {
    let service: AdminToolsService;
    let httpClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
    let urls: { apiUrl: string };

    beforeEach(() => {
        httpClient = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
        urls = { apiUrl: 'http://localhost:5500' };
        service = new AdminToolsService(httpClient as any, urls as any);
    });

    it('should get active accounts', () => {
        const accounts = [{ id: '1', displayName: 'Test' }];
        httpClient.get.mockReturnValue(of(accounts));

        service.getActiveAccounts().subscribe((result) => {
            expect(result).toBe(accounts);
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/accounts/active');
    });

    it('should invalidate caches', () => {
        httpClient.get.mockReturnValue(of(null));

        service.invalidateCaches().subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/data/invalidate');
    });

    it('should get discord roles as text', () => {
        httpClient.get.mockReturnValue(of('role1\nrole2'));

        service.getDiscordRoles().subscribe((result) => {
            expect(result).toBe('role1\nrole2');
        });

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/discord/roles', { responseType: 'text' });
    });

    it('should update discord roles', () => {
        httpClient.get.mockReturnValue(of(null));

        service.updateDiscordRoles().subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/discord/updateuserroles');
    });

    it('should delete github issue command', () => {
        httpClient.delete.mockReturnValue(of(null));

        service.deleteGithubIssueCommand().subscribe();

        expect(httpClient.delete).toHaveBeenCalledWith('http://localhost:5500/discord/commands/newGithubIssue');
    });

    it('should reload teamspeak', () => {
        httpClient.get.mockReturnValue(of(null));

        service.reloadTeamspeak().subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/teamspeak/reload');
    });

    it('should test notification', () => {
        httpClient.get.mockReturnValue(of(null));

        service.testNotification().subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/debug/notifications-test');
    });

    it('should emergency cleanup stuck builds', () => {
        const response = { message: 'Cleaned up 2 builds' };
        httpClient.post.mockReturnValue(of(response));

        service.emergencyCleanupStuckBuilds().subscribe((result) => {
            expect(result).toBe(response);
        });

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/modpack/builds/emergency-cleanup', {});
    });
});
