import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { NpcVoicesService } from './npc-voices.service';
import { UrlService } from '@app/core/services/url.service';

describe('NpcVoicesService', () => {
    let service: NpcVoicesService;
    let httpClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        httpClient = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                NpcVoicesService,
                { provide: HttpClient, useValue: httpClient },
                { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } }
            ]
        });
        service = TestBed.inject(NpcVoicesService);
    });

    it('gets voices', () => {
        httpClient.get.mockReturnValue(of([]));
        service.getVoices().subscribe();
        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/npcvoices');
    });

    it('uploads form data', () => {
        const fd = new FormData();
        httpClient.post.mockReturnValue(of({}));
        service.upload(fd).subscribe();
        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/npcvoices', fd);
    });

    it('deletes by id', () => {
        httpClient.delete.mockReturnValue(of({}));
        service.delete('v1').subscribe();
        expect(httpClient.delete).toHaveBeenCalledWith('http://localhost:5500/npcvoices/v1');
    });

    it('fetches a sample as a blob so the auth interceptor applies', () => {
        httpClient.get.mockReturnValue(of(new Blob()));
        service.getSample('v1').subscribe();
        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/npcvoices/v1/sample', { responseType: 'blob' });
    });

    it('generateMoods POSTs the chosen moods, or none for every missing mood', () => {
        httpClient.post.mockReturnValue(of({}));
        service.generateMoods('smuggler').subscribe();
        service.generateMoods('smuggler', ['sad']).subscribe();
        expect(httpClient.post).toHaveBeenNthCalledWith(1, 'http://localhost:5500/npcvoices/smuggler/generate-moods', { moods: [] });
        expect(httpClient.post).toHaveBeenNthCalledWith(2, 'http://localhost:5500/npcvoices/smuggler/generate-moods', { moods: ['sad'] });
    });

    it('getJob GETs the job endpoint', () => {
        httpClient.get.mockReturnValue(of({}));
        service.getJob('smuggler').subscribe();
        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/npcvoices/smuggler/job');
    });
});
