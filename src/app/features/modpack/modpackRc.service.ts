import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ModpackRc } from './models/modpack-rc';
import { ModpackBuild } from './models/modpack-build';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { ModpackHubService } from './services/modpack-hub.service';

@Injectable()
export class ModpackRcService implements OnDestroy {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);
    private modpackHub = inject(ModpackHubService);

    rcs: ModpackRc[] = [];
    private onReceiveRc: ((build: ModpackBuild) => void) | null = null;
    private reconnectSubscription: Subscription | null = null;

    ngOnDestroy(): void {
        this.disconnect();
    }

    connect(callback: () => void, newBuildCallback: (string) => void) {
        this.getData(callback);

        this.modpackHub.connect();
        this.onReceiveRc = (build: ModpackBuild) => {
            this.patchBuild(build);
            newBuildCallback(build.version);
        };
        this.modpackHub.on('ReceiveReleaseCandidateBuild', this.onReceiveRc);
        this.reconnectSubscription = this.modpackHub.reconnected$.subscribe({
            next: () => {
                this.getData(callback);
            }
        });
    }

    disconnect() {
        this.reconnectSubscription?.unsubscribe();
        this.reconnectSubscription = null;
        if (this.onReceiveRc) {
            this.modpackHub.off('ReceiveReleaseCandidateBuild', this.onReceiveRc);
            this.onReceiveRc = null;
        }
        this.modpackHub.disconnect();
    }

    sortRcs() {
        this.rcs.sort((a: ModpackRc, b: ModpackRc) => b.version.localeCompare(a.version, undefined, { numeric: true }));
    }

    sortBuilds(rc: ModpackRc) {
        rc.builds.sort((a: ModpackBuild, b: ModpackBuild) => (a.buildNumber > b.buildNumber ? -1 : a.buildNumber < b.buildNumber ? 1 : 0));
    }

    patchBuild(build: ModpackBuild) {
        let index = this.rcs.findIndex((x) => x.version === build.version);
        if (index === -1) {
            this.rcs.unshift({ version: build.version, builds: [] });
            index = 0;
        }

        const rc = this.rcs[index];
        const buildIndex = rc.builds.findIndex((x) => x.id === build.id);
        if (buildIndex === -1) {
            rc.builds.unshift(build);
        } else {
            rc.builds.splice(buildIndex, 1, build);
        }

        this.sortRcs();
        this.sortBuilds(rc);
    }

    getData(callback: () => void) {
        // get request for all builds (groups by version)
        this.httpClient.get(this.urls.apiUrl + '/modpack/rcs').subscribe({
            next: (builds: ModpackBuild[]) => {
                // this.rcs = builds;
                if (builds.length === 0) {
                    this.rcs = [];
                }

                builds.forEach((build: ModpackBuild) => {
                    this.patchBuild(build);
                });
                callback();
            }
        });
    }
}
