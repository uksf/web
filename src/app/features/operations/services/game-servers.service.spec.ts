import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { GameServersService } from './game-servers.service';
import { UrlService } from '@app/core/services/url.service';
import { of } from 'rxjs';
import { GameServersUpdate, MissionUploadResponse } from '../models/game-server';

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
        TestBed.configureTestingModule({
            providers: [
                GameServersService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: mockUrls },
            ]
        });
        service = TestBed.inject(GameServersService);
    });

    it('getServers calls GET /gameservers', () => {
        const mockResponse: GameServersUpdate = { servers: [], instanceCount: 0, missions: [] };
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

    it('toggleDisabledState calls POST /gameservers/disabled', () => {
        service.toggleDisabledState(false).subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/disabled',
            { state: true }
        );
    });

    it('deleteServer calls DELETE /gameservers/:id', () => {
        service.deleteServer('server1').subscribe();

        expect(mockHttpClient.delete).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/server1'
        );
    });

    it('updateServerOrder calls PATCH /gameservers/order', () => {
        const body = { previousIndex: 0, newIndex: 1 };
        mockHttpClient.patch.mockReturnValue(of([]));

        service.updateServerOrder(body).subscribe();

        expect(mockHttpClient.patch).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/order',
            body
        );
    });

    it('uploadMission calls POST /gameservers/mission with reportProgress', () => {
        const formData = new FormData();
        const mockResponse: MissionUploadResponse = { missions: [], missionReports: [] };
        mockHttpClient.post.mockReturnValue(of(mockResponse));

        service.uploadMission(formData).subscribe({
            next: (response) => {
                expect(response).toEqual(mockResponse);
            }
        });

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/missions/upload',
            formData,
            expect.objectContaining({ reportProgress: true })
        );
    });

    it('launchServer calls POST /gameservers/launch/:id', () => {
        service.launchServer('server1', 'mission.pbo').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/launch/server1',
            { missionName: 'mission.pbo' }
        );
    });

    it('stopServer calls POST /gameservers/stop/:id', () => {
        service.stopServer('server1').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/stop/server1',
            null
        );
    });

    it('killServer calls POST /gameservers/kill/:id', () => {
        service.killServer('server1').subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/kill/server1',
            null
        );
    });

    it('killAllServers calls POST /gameservers/killall', () => {
        service.killAllServers().subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/killall',
            null
        );
    });

    it('addServer calls PUT /gameservers with JSON Content-Type header', () => {
        const body = JSON.stringify({ name: 'Test' });
        service.addServer(body).subscribe();

        expect(mockHttpClient.put).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers',
            body,
            expect.objectContaining({ headers: expect.any(Object) })
        );
        const headers = mockHttpClient.put.mock.calls[0][2].headers;
        expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('editServer calls PATCH /gameservers with JSON Content-Type header', () => {
        const server = { id: 'server1', name: 'Test' };
        service.editServer(server).subscribe();

        expect(mockHttpClient.patch).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers',
            server,
            expect.objectContaining({ headers: expect.any(Object) })
        );
        const headers = mockHttpClient.patch.mock.calls[0][2].headers;
        expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('checkServerExists calls POST /gameservers/:value', () => {
        const server = { id: 'server1' };
        service.checkServerExists('testName', server).subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/testName',
            server
        );
    });

    it('getServerMods calls GET /gameservers/:id/mods', () => {
        service.getServerMods('server1').subscribe();

        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/gameservers/server1/mods');
    });

    it('updateServerMods calls POST /gameservers/:id/mods with JSON header', () => {
        const server = { id: 'server1', mods: [] };
        service.updateServerMods('server1', server).subscribe();

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/server1/mods',
            server,
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('resetServerMods calls GET /gameservers/:id/mods/reset', () => {
        service.resetServerMods('server1').subscribe();

        expect(mockHttpClient.get).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/server1/mods/reset',
            expect.objectContaining({ headers: expect.any(Object) })
        );
    });

    it('downloadLog should request blob from correct URL', () => {
        service.downloadLog('server1', 'server.rpt').subscribe();

        expect(mockHttpClient.get).toHaveBeenCalledWith(
            'http://localhost:5500/gameservers/server1/log/download?source=server.rpt',
            { responseType: 'blob' }
        );
    });
});
