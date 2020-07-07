import { Injectable, OnDestroy } from '@angular/core';
import { SignalRService, ConnectionContainer } from './signalr.service';
import { ModpackRc } from 'app/Models/ModpackRc';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ModpackBuildStep } from 'app/Models/ModpackBuildStep';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';

@Injectable()
export class ModpackRcService implements OnDestroy {
    private hubConnection: ConnectionContainer;
    private buildConnection: ConnectionContainer;
    rcs: ModpackRc[] = [];

    constructor(
        private httpClient: HttpClient,
        private urls: UrlService,
        private signalrService: SignalRService) { }

    ngOnDestroy(): void {
        this.disconnect();
    }

    connect(callback: () => void) {
        this.getData(callback);

        this.hubConnection = this.signalrService.connect(`builds`);
        this.hubConnection.connection.on('ReceiveReleaseCandidateBuild', (build: ModpackBuild) => {
            this.patchBuild(build);
        });
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.getData(callback);
        });
    }

    disconnect() {
        if (this.hubConnection !== undefined) {
            this.hubConnection.connection.stop();
        }

        if (this.buildConnection !== undefined) {
            this.buildConnection.connection.stop();
        }
    }

    connectToBuildLog(build: ModpackBuild, selectCallback: () => void) {
        this.getBuildLogData(build.id, () => {
            this.buildConnection = this.signalrService.connect(`builds?buildId=${build.id}`);
            this.buildConnection.connection.on('ReceiveBuildStep', (step: ModpackBuildStep) => {
                this.patchStep(build, step);
                selectCallback();
            });
            this.buildConnection.reconnectEvent.subscribe(() => {
                this.getBuildLogData(build.id, () => {
                    selectCallback();
                });
            });

            selectCallback();
        });
    }

    disconnectFromBuildLog() {
        if (this.buildConnection !== undefined) {
            this.buildConnection.connection.stop();
        }
    }

    sortRcs() {
        this.rcs.sort((a: ModpackRc, b: ModpackRc) => b.version.localeCompare(a.version, undefined, { numeric: true, }));
    }

    sortBuilds(rc: ModpackRc) {
        rc.builds.sort((a: ModpackBuild, b: ModpackBuild) => a.buildNumber > b.buildNumber ? -1 : a.buildNumber < b.buildNumber ? 1 : 0);
    }

    patchBuild(build: ModpackBuild) {
        let index = this.rcs.findIndex(x => x.version === build.version);
        if (index === -1) {
            this.rcs.unshift({ version: build.version, builds: [] });
            index = 0;
        }

        const rc = this.rcs[index];
        const buildIndex = rc.builds.findIndex(x => x.id === build.id);
        if (buildIndex === -1) {
            rc.builds.unshift(build);
        } else {
            rc.builds.splice(buildIndex, 1, build);
        }

        this.sortRcs();
        this.sortBuilds(rc);
    }

    patchStep(build: ModpackBuild, step: ModpackBuildStep) {
        const rc = this.rcs.find(x => x.version === build.version);
        const index = rc.builds.findIndex(x => x.id === build.id);

        if (index === -1) {
            return;
        }

        rc.builds[index].steps[step.index] = step;
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
        }, error => this.urls.errorWrapper('Failed to get release candidates', error));
    }

    getBuildLogData(id: string, callback: () => void) {
        // get request for build
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${id}`).subscribe((build: ModpackBuild) => {
            this.patchBuild(build);
            callback();
        }, error => this.urls.errorWrapper('Failed to get build', error));
    }

    rebuild(build: ModpackBuild) {
        // get request for rebuild
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${build.id}/rebuild`).subscribe(
            () => { },
            error => this.urls.errorWrapper('Failed to rebuild', error)
        );
    }

    cancel(build: ModpackBuild, callback: () => void) {
        // get request for build cancel
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${build.id}/cancel`).subscribe(() => {
            callback();
        }, error => {
            callback();
            this.urls.errorWrapper('Failed to cancel build', error)
        });
    }
}

