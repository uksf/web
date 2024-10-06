import { Injectable, OnDestroy } from '@angular/core';
import { ConnectionContainer, SignalRService } from '../Services/signalr.service';
import { ModpackRc } from './models/ModpackRc';
import { ModpackBuild } from './models/ModpackBuild';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../Services/url.service';

@Injectable()
export class ModpackRcService implements OnDestroy {
    private hubConnection: ConnectionContainer;
    rcs: ModpackRc[] = [];

    constructor(private httpClient: HttpClient, private urls: UrlService, private signalrService: SignalRService) {}

    ngOnDestroy(): void {
        this.disconnect();
    }

    connect(callback: () => void, newBuildCallback: (string) => void) {
        this.getData(callback);

        this.hubConnection = this.signalrService.connect(`modpack`);
        this.hubConnection.connection.on('ReceiveReleaseCandidateBuild', (build: ModpackBuild) => {
            this.patchBuild(build);
            newBuildCallback(build.version);
        });
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.getData(callback);
        });
    }

    disconnect() {
        if (this.hubConnection !== undefined) {
            this.hubConnection.connection.stop();
        }
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
        this.httpClient.get(this.urls.apiUrl + '/modpack/rcs').subscribe((builds: ModpackBuild[]) => {
            // this.rcs = builds;
            if (builds.length === 0) {
                this.rcs = [];
            }

            builds.forEach((build: ModpackBuild) => {
                this.patchBuild(build);
            });
            callback();
        });
    }
}
