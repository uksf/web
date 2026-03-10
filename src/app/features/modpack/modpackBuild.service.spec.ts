import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { ModpackBuildService } from './modpackBuild.service';
import { ModpackHubService } from './services/modpack-hub.service';
import { UrlService } from '@app/core/services/url.service';
import { ModpackBuild } from './models/modpack-build';

describe('ModpackBuildService', () => {
    let service: ModpackBuildService;
    let httpClient: { get: ReturnType<typeof vi.fn> };
    let reconnected$: Subject<void>;

    beforeEach(() => {
        reconnected$ = new Subject<void>();
        httpClient = { get: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                ModpackBuildService,
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
                { provide: UrlService, useValue: { apiUrl: 'http://test' } }
            ]
        });
        service = TestBed.inject(ModpackBuildService);
    });

    it('should store builds from HTTP response and call callback', () => {
        const builds$ = new Subject<ModpackBuild[]>();
        httpClient.get.mockReturnValue(builds$);

        const callback = vi.fn();
        service.connect(callback, vi.fn());

        const builds = [{ id: '1', buildNumber: 1 }] as ModpackBuild[];
        builds$.next(builds);

        expect(service.builds).toBe(builds);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel in-flight HTTP request on disconnect', () => {
        const builds$ = new Subject<ModpackBuild[]>();
        httpClient.get.mockReturnValue(builds$);

        const callback = vi.fn();
        service.connect(callback, vi.fn());

        service.disconnect();

        builds$.next([{ id: '1', buildNumber: 1 }] as ModpackBuild[]);

        expect(callback).not.toHaveBeenCalled();
    });

    it('should cancel previous HTTP request when reconnect triggers a new one', () => {
        const firstBuilds$ = new Subject<ModpackBuild[]>();
        const secondBuilds$ = new Subject<ModpackBuild[]>();
        httpClient.get.mockReturnValueOnce(firstBuilds$).mockReturnValueOnce(secondBuilds$);

        const callback = vi.fn();
        service.connect(callback, vi.fn());

        // Reconnect before first request completes
        reconnected$.next();

        // First request completes late — should be ignored (switchMap unsubscribed it)
        firstBuilds$.next([{ id: 'old', buildNumber: 1 }] as ModpackBuild[]);
        expect(callback).not.toHaveBeenCalled();

        // Second request completes — should be used
        secondBuilds$.next([{ id: 'new', buildNumber: 2 }] as ModpackBuild[]);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(service.builds).toEqual([{ id: 'new', buildNumber: 2 }]);
    });

    it('should register and unregister SignalR event handler', () => {
        const builds$ = new Subject<ModpackBuild[]>();
        httpClient.get.mockReturnValue(builds$);
        const modpackHub = TestBed.inject(ModpackHubService);

        service.connect(vi.fn(), vi.fn());
        expect(modpackHub.on).toHaveBeenCalledWith('ReceiveBuild', expect.any(Function));

        service.disconnect();
        expect(modpackHub.off).toHaveBeenCalledWith('ReceiveBuild', expect.any(Function));
    });

    it('should patch build when ReceiveBuild fires', () => {
        const builds$ = new Subject<ModpackBuild[]>();
        httpClient.get.mockReturnValue(builds$);
        const modpackHub = TestBed.inject(ModpackHubService);

        const newBuildCallback = vi.fn();
        service.connect(vi.fn(), newBuildCallback);

        builds$.next([{ id: '1', buildNumber: 1 }] as ModpackBuild[]);

        const receiveBuildHandler = (modpackHub.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
        const newBuild = { id: '2', buildNumber: 2 } as ModpackBuild;
        receiveBuildHandler(newBuild);

        expect(service.builds).toHaveLength(2);
        expect(newBuildCallback).toHaveBeenCalledWith('2');
    });

    it('should sort builds by buildNumber descending', () => {
        service.builds = [
            { id: '1', buildNumber: 1 },
            { id: '3', buildNumber: 3 },
            { id: '2', buildNumber: 2 }
        ] as ModpackBuild[];

        service.sortBuilds();

        expect(service.builds.map((b) => b.buildNumber)).toEqual([3, 2, 1]);
    });
});
