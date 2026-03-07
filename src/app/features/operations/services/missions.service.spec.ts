import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { MissionsService } from './missions.service';
import { UrlService } from '@app/core/services/url.service';
import { of } from 'rxjs';
import { Mission, MissionUploadResponse } from '../models/game-server';

describe('MissionsService', () => {
    let service: MissionsService;
    let mockHttpClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
    let mockUrls: { apiUrl: string };

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of({})),
            post: vi.fn().mockReturnValue(of({})),
            delete: vi.fn().mockReturnValue(of({}))
        };
        mockUrls = { apiUrl: 'http://localhost:5500' };
        TestBed.configureTestingModule({
            providers: [
                MissionsService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: mockUrls },
            ]
        });
        service = TestBed.inject(MissionsService);
    });

    it('getActiveMissions calls GET /missions', () => {
        const mockResponse: Mission[] = [];
        mockHttpClient.get.mockReturnValue(of(mockResponse));
        service.getActiveMissions().subscribe({
            next: (response) => expect(response).toEqual(mockResponse)
        });
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/missions');
    });

    it('getArchivedMissions calls GET /missions/archived', () => {
        const mockResponse: Mission[] = [];
        mockHttpClient.get.mockReturnValue(of(mockResponse));
        service.getArchivedMissions().subscribe({
            next: (response) => expect(response).toEqual(mockResponse)
        });
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/missions/archived');
    });

    it('uploadMission calls POST /missions/upload with Hub-Connection-Id header', () => {
        const formData = new FormData();
        const mockResponse: MissionUploadResponse = { missions: [], missionReports: [] };
        mockHttpClient.post.mockReturnValue(of(mockResponse));
        service.uploadMission(formData, 'conn-123').subscribe({
            next: (response) => expect(response).toEqual(mockResponse)
        });
        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/missions/upload',
            formData,
            expect.objectContaining({ headers: expect.any(Object) })
        );
        const headers = mockHttpClient.post.mock.calls[0][2].headers;
        expect(headers.get('Hub-Connection-Id')).toBe('conn-123');
    });

    it('downloadMission calls GET /missions/:fileName/download as blob', () => {
        const mockBlob = new Blob(['test']);
        mockHttpClient.get.mockReturnValue(of(mockBlob));
        service.downloadMission('co40_test.Altis.pbo').subscribe({
            next: (response) => expect(response).toBeInstanceOf(Blob)
        });
        expect(mockHttpClient.get).toHaveBeenCalledWith(
            'http://localhost:5500/missions/co40_test.Altis.pbo/download',
            { responseType: 'blob' }
        );
    });

    it('deleteMission calls DELETE /missions/:fileName with Hub-Connection-Id header', () => {
        service.deleteMission('co40_test.Altis.pbo', 'conn-123').subscribe();
        expect(mockHttpClient.delete).toHaveBeenCalledWith(
            'http://localhost:5500/missions/co40_test.Altis.pbo',
            expect.objectContaining({ headers: expect.any(Object) })
        );
        const headers = mockHttpClient.delete.mock.calls[0][1].headers;
        expect(headers.get('Hub-Connection-Id')).toBe('conn-123');
    });

    it('archiveMission calls POST /missions/:fileName/archive with Hub-Connection-Id header', () => {
        service.archiveMission('co40_test.Altis.pbo', 'conn-123').subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/missions/co40_test.Altis.pbo/archive',
            null,
            expect.objectContaining({ headers: expect.any(Object) })
        );
        const headers = mockHttpClient.post.mock.calls[0][2].headers;
        expect(headers.get('Hub-Connection-Id')).toBe('conn-123');
    });

    it('restoreMission calls POST /missions/:fileName/restore with Hub-Connection-Id header', () => {
        service.restoreMission('co40_test.Altis.pbo', 'conn-123').subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/missions/co40_test.Altis.pbo/restore',
            null,
            expect.objectContaining({ headers: expect.any(Object) })
        );
        const headers = mockHttpClient.post.mock.calls[0][2].headers;
        expect(headers.get('Hub-Connection-Id')).toBe('conn-123');
    });
});
