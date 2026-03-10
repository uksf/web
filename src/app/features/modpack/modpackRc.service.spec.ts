import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { ModpackRcService } from './modpackRc.service';
import { ModpackHubService } from './services/modpack-hub.service';
import { UrlService } from '@app/core/services/url.service';
import { ModpackBuild } from './models/modpack-build';

describe('ModpackRcService', () => {
    let service: ModpackRcService;
    let httpClient: { get: ReturnType<typeof vi.fn> };
    let reconnected$: Subject<void>;

    beforeEach(() => {
        reconnected$ = new Subject<void>();
        httpClient = { get: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                ModpackRcService,
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
        service = TestBed.inject(ModpackRcService);
    });

    it('should group builds by version and call callback', () => {
        const builds$ = new Subject<ModpackBuild[]>();
        httpClient.get.mockReturnValue(builds$);

        const callback = vi.fn();
        service.connect(callback, vi.fn());

        const builds = [
            { id: '1', version: '1.0.0', buildNumber: 1 },
            { id: '2', version: '1.0.0', buildNumber: 2 }
        ] as ModpackBuild[];
        builds$.next(builds);

        expect(service.rcs).toHaveLength(1);
        expect(service.rcs[0].version).toBe('1.0.0');
        expect(service.rcs[0].builds).toHaveLength(2);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel in-flight HTTP request on disconnect', () => {
        const builds$ = new Subject<ModpackBuild[]>();
        httpClient.get.mockReturnValue(builds$);

        const callback = vi.fn();
        service.connect(callback, vi.fn());

        service.disconnect();

        builds$.next([{ id: '1', version: '1.0.0', buildNumber: 1 }] as ModpackBuild[]);

        expect(callback).not.toHaveBeenCalled();
    });

    it('should cancel previous HTTP request when reconnect triggers a new one', () => {
        const firstBuilds$ = new Subject<ModpackBuild[]>();
        const secondBuilds$ = new Subject<ModpackBuild[]>();
        httpClient.get.mockReturnValueOnce(firstBuilds$).mockReturnValueOnce(secondBuilds$);

        const callback = vi.fn();
        service.connect(callback, vi.fn());

        reconnected$.next();

        firstBuilds$.next([{ id: 'old', version: '0.9.0', buildNumber: 1 }] as ModpackBuild[]);
        expect(callback).not.toHaveBeenCalled();

        secondBuilds$.next([{ id: 'new', version: '1.0.0', buildNumber: 1 }] as ModpackBuild[]);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should register and unregister SignalR event handler', () => {
        const builds$ = new Subject<ModpackBuild[]>();
        httpClient.get.mockReturnValue(builds$);
        const modpackHub = TestBed.inject(ModpackHubService);

        service.connect(vi.fn(), vi.fn());
        expect(modpackHub.on).toHaveBeenCalledWith('ReceiveReleaseCandidateBuild', expect.any(Function));

        service.disconnect();
        expect(modpackHub.off).toHaveBeenCalledWith('ReceiveReleaseCandidateBuild', expect.any(Function));
    });

    it('should clear rcs when empty array is received', () => {
        const builds$ = new Subject<ModpackBuild[]>();
        httpClient.get.mockReturnValue(builds$);

        service.rcs = [{ version: '1.0.0', builds: [] }];
        service.connect(vi.fn(), vi.fn());

        builds$.next([]);

        expect(service.rcs).toEqual([]);
    });
});
