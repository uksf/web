import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { DiscordChannelContentsService } from './discord-channel-contents.service';
import { UrlService } from '@app/core/services/url.service';

describe('DiscordChannelContentsService', () => {
    let service: DiscordChannelContentsService;
    let httpClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
    const request = { channelId: '710495901340139652', name: 'Lobby', content: 'Welcome' };

    beforeEach(() => {
        httpClient = { get: vi.fn().mockReturnValue(of([])), post: vi.fn().mockReturnValue(of({})), put: vi.fn().mockReturnValue(of({})) };
        TestBed.configureTestingModule({
            providers: [DiscordChannelContentsService, { provide: HttpClient, useValue: httpClient }, { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } }]
        });
        service = TestBed.inject(DiscordChannelContentsService);
    });

    it('gets all channel contents', () => {
        service.getAll().subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/discord/channelContents');
    });

    it('creates channel content', () => {
        service.create(request).subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/discord/channelContents', request);
    });

    it('updates channel content by id', () => {
        service.update('abc', request).subscribe();

        expect(httpClient.put).toHaveBeenCalledWith('http://localhost:5500/discord/channelContents/abc', request);
    });

    it('publishes channel content by id', () => {
        service.publish('abc').subscribe();

        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/discord/channelContents/abc/publish', {});
    });
});
