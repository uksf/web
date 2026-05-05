import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { ModpackReleaseService } from './modpackRelease.service';
import { ModpackHubService } from './services/modpack-hub.service';
import { UrlService } from '@app/core/services/url.service';
import { ModpackRelease } from './models/modpack-release';
import { MatDialog } from '@angular/material/dialog';

describe('ModpackReleaseService', () => {
    let service: ModpackReleaseService;
    let httpClient: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> };
    let reconnected$: Subject<void>;

    beforeEach(() => {
        reconnected$ = new Subject<void>();
        httpClient = {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            patch: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                ModpackReleaseService,
                { provide: HttpClient, useValue: httpClient },
                {
                    provide: ModpackHubService,
                    useValue: {
                        connect: vi.fn(),
                        disconnect: vi.fn(),
                        on: vi.fn(),
                        off: vi.fn(),
                        reconnected$
                    }
                },
                { provide: UrlService, useValue: { apiUrl: 'http://test' } },
                { provide: MatDialog, useValue: { open: vi.fn(), closeAll: vi.fn() } }
            ]
        });
        service = TestBed.inject(ModpackReleaseService);
    });

    it('should store releases from HTTP response and call callback', () => {
        const releases$ = new Subject<ModpackRelease[]>();
        httpClient.get.mockReturnValue(releases$);

        const callback = vi.fn();
        service.connect(callback, vi.fn());

        const releases = [{ version: '1.0.0' }] as ModpackRelease[];
        releases$.next(releases);

        expect(service.releases).toBe(releases);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel in-flight HTTP request on disconnect', () => {
        const releases$ = new Subject<ModpackRelease[]>();
        httpClient.get.mockReturnValue(releases$);

        const callback = vi.fn();
        service.connect(callback, vi.fn());

        service.disconnect();

        releases$.next([{ version: '1.0.0' }] as ModpackRelease[]);

        expect(callback).not.toHaveBeenCalled();
    });

    it('should cancel previous HTTP request when reconnect triggers a new one', () => {
        const firstReleases$ = new Subject<ModpackRelease[]>();
        const secondReleases$ = new Subject<ModpackRelease[]>();
        httpClient.get.mockReturnValueOnce(firstReleases$).mockReturnValueOnce(secondReleases$);

        const callback = vi.fn();
        service.connect(callback, vi.fn());

        reconnected$.next();

        firstReleases$.next([{ version: '0.9.0' }] as ModpackRelease[]);
        expect(callback).not.toHaveBeenCalled();

        secondReleases$.next([{ version: '1.0.0' }] as ModpackRelease[]);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(service.releases).toEqual([{ version: '1.0.0' }]);
    });

    it('should register and unregister SignalR event handler', () => {
        const releases$ = new Subject<ModpackRelease[]>();
        httpClient.get.mockReturnValue(releases$);
        const modpackHub = TestBed.inject(ModpackHubService);

        service.connect(vi.fn(), vi.fn());
        expect(modpackHub.on).toHaveBeenCalledWith('ReceiveRelease', expect.any(Function));

        service.disconnect();
        expect(modpackHub.off).toHaveBeenCalledWith('ReceiveRelease', expect.any(Function));
    });
});
