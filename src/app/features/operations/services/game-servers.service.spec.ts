import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameServersService } from './game-servers.service';
import { of } from 'rxjs';
import { GameServersResponse, MissionUploadResponse, ServerStatusResponse } from '../models/game-server';

describe('GameServersService', () => {
    let service: GameServersService;
    let mockHttpClient: any;
    let mockUrls: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of({})),
            post: vi.fn().mockReturnValue(of({})),
            put: vi.fn().mockReturnValue(of({})),
            patch: vi.fn().mockReturnValue(of({})),
            delete: vi.fn().mockReturnValue(of({}))
        };
        mockUrls = { apiUrl: 'http://localhost:5500' };
        service = new GameServersService(mockHttpClient, mockUrls);
    });

    it('getServers calls GET /gameservers', () => {
        const mockResponse: GameServersResponse = { servers: [], instanceCount: 0, missions: [] };
        mockHttpClient.get.mockReturnValue(of(mockResponse));

        service.getServers().subscribe({
            next: (response) => {
                expect(response).toEqual(mockResponse);
            }
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/gameservers');
    });

    it('getDisabledState calls GET /gameservers/disabled', () => {
        mockHttpClient.get.mockReturnValue(of(false));

        service.getDisabledState().subscribe({
            next: (state) => {
                expect(state).toBe(false);
            }
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/gameservers/disabled');
    });

    it('getServerStatus calls GET /gameservers/status/:id', () => {
        const mockResponse: ServerStatusResponse = {
            gameServer: { id: 'server1', name: 'Test', status: { parsedUptime: '00:00:00', stopping: false, started: false, running: false, mission: '', players: 0 } },
            instanceCount: 1
        };
        mockHttpClient.get.mockReturnValue(of(mockResponse));

        service.getServerStatus('server1').subscribe({
            next: (response) => {
                expect(response.gameServer.id).toBe('server1');
            }
        });

        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/gameservers/status/server1');
    });

    it('toggleDisabledState calls POST /gameservers/disabled with Hub-Connection-Id header', () => {
        service.toggleDisabledState(false, 'conn-123').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/disabled',
            { state: true },
            expect.objectContaining({ headers: expect.any(Object) })
        );

        const headers = mockHttpClient.post.mock.calls[0][2].headers;
        expect(headers.get('Hub-Connection-Id')).toBe('conn-123');
    });

    it('deleteServer calls DELETE /gameservers/:id with Hub-Connection-Id header', () => {
        mockHttpClient.delete.mockReturnValue(of([]));

        service.deleteServer('server1', 'conn-123').subscribe({
            next: (response) => {
                expect(response).toEqual([]);
            }
        });

        expect(mockHttpClient.delete).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/server1',
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('updateServerOrder calls PATCH /gameservers/order', () => {
        const body = { previousIndex: 0, newIndex: 1 };
        mockHttpClient.patch.mockReturnValue(of([]));

        service.updateServerOrder(body, 'conn-123').subscribe();

        expect(mockHttpClient.patch).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/order',
            body,
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('uploadMission calls POST /gameservers/mission with reportProgress', () => {
        const formData = new FormData();
        const mockResponse: MissionUploadResponse = { missions: [], missionReports: [] };
        mockHttpClient.post.mockReturnValue(of(mockResponse));

        service.uploadMission(formData, 'conn-123').subscribe({
            next: (response) => {
                expect(response).toEqual(mockResponse);
            }
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/mission',
            formData,
            expect.objectContaining({ reportProgress: true, headers: expect.any(Object) })
        );
    });

    it('launchServer calls POST /gameservers/launch/:id', () => {
        service.launchServer('server1', 'mission.pbo', 'conn-123').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/launch/server1',
            { missionName: 'mission.pbo' },
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('stopServer calls POST /gameservers/stop/:id', () => {
        service.stopServer('server1', 'conn-123').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/stop/server1',
            null,
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('killServer calls POST /gameservers/kill/:id', () => {
        service.killServer('server1', 'conn-123').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/kill/server1',
            null,
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('killAllServers calls POST /gameservers/killall', () => {
        service.killAllServers('conn-123').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/killall',
            null,
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });
});
