import { Injectable, OnDestroy } from '@angular/core';
import { SignalRService, ConnectionContainer } from './signalr.service';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ModpackBuildStep } from 'app/Models/ModpackBuildStep';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { ModpackBuildRelease } from 'app/Models/ModpackBuildRelease';

@Injectable()
export class ModpackBuildService implements OnDestroy {
    private hubConnection: ConnectionContainer;
    private buildConnection: ConnectionContainer;
    buildReleases: ModpackBuildRelease[] = [];

    constructor(
        private httpClient: HttpClient,
        private urls: UrlService,
        private signalrService: SignalRService) { }

    ngOnDestroy(): void {
        this.disconnect();
    }

    connect(callback: () => void) {
        this.getBuildsData(callback);

        this.hubConnection = this.signalrService.connect(`builds`);
        this.hubConnection.connection.on('ReceiveBuildRelease', (buildRelease: ModpackBuildRelease) => {
            this.patchBuildRelease(buildRelease);
        });
        this.hubConnection.connection.on('ReceiveBuild', (version: string, build: ModpackBuild) => {
            this.patchBuild(version, build);
        });
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.getBuildsData(callback);
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

    connectToBuildLog(version: string, build: ModpackBuild, selectCallback: () => void) {
        this.getBuildLogData(version, build.buildNumber, () => {
            this.buildConnection = this.signalrService.connect(`builds?version=${version}.${build.buildNumber}`);
            this.buildConnection.connection.on('ReceiveBuildStep', (step: ModpackBuildStep) => {
                this.patchStep(version, build, step);
                selectCallback();
            });
            this.buildConnection.reconnectEvent.subscribe(() => {
                this.getBuildLogData(version, build.buildNumber, () => {
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

    patchBuildRelease(buildRelease: ModpackBuildRelease) {
        const index = this.buildReleases.findIndex(x => x.version === buildRelease.version);
        if (index === -1) {
            this.buildReleases.unshift(buildRelease);
            return;
        }

        this.buildReleases[index].version = buildRelease.version;
        this.buildReleases[index].builds = buildRelease.builds;
    }

    patchBuild(version: string, build: ModpackBuild) {
        const index = this.buildReleases.findIndex(x => x.version === version);
        const buildRelease = this.buildReleases[index];
        const buildIndex = buildRelease.builds.findIndex(x => x.buildNumber === build.buildNumber);
        if (buildIndex === -1) {
            buildRelease.builds.unshift(build);
            return;
        }

        this.buildReleases[index].builds[buildIndex].isNewVersion = build.isNewVersion;
        this.buildReleases[index].builds[buildIndex].isReleaseCandidate = build.isReleaseCandidate;
        this.buildReleases[index].builds[buildIndex].isRelease = build.isRelease;
        this.buildReleases[index].builds[buildIndex].running = build.running;
        this.buildReleases[index].builds[buildIndex].finished = build.finished;
        this.buildReleases[index].builds[buildIndex].buildResult = build.buildResult;
        this.buildReleases[index].builds[buildIndex].steps = build.steps;
        this.buildReleases[index].builds[buildIndex].commit = build.commit;
    }

    patchStep(version: string, build: ModpackBuild, step: ModpackBuildStep) {
        const index = this.buildReleases.findIndex(x => x.version === version);
        const buildRelease = this.buildReleases[index];
        const buildIndex = buildRelease.builds.findIndex(x => x.buildNumber === build.buildNumber);
        if (buildIndex === -1) {
            return;
        }

        this.buildReleases[index].builds[buildIndex].steps[step.index].startTime = step.startTime;
        this.buildReleases[index].builds[buildIndex].steps[step.index].endTime = step.endTime;
        this.buildReleases[index].builds[buildIndex].steps[step.index].running = step.running;
        this.buildReleases[index].builds[buildIndex].steps[step.index].finished = step.finished;
        this.buildReleases[index].builds[buildIndex].steps[step.index].buildResult = step.buildResult;
        this.buildReleases[index].builds[buildIndex].steps[step.index].logs = step.logs;
    }

    getBuildsData(callback: () => void) {
        // get request for all releases
        this.httpClient.get(this.urls.apiUrl + '/modpack/builds').subscribe((buildReleases: ModpackBuildRelease[]) => {
            buildReleases.forEach((buildRelease: ModpackBuildRelease) => {
                this.patchBuildRelease(buildRelease);
            })
            callback();
        }, error => this.urls.errorWrapper('Failed to get releases', error));
    }

    getBuildLogData(version: string, buildNumber: number, callback: () => void) {
        // get request for build
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${version}/${buildNumber}`).subscribe((build: ModpackBuild) => {
            this.patchBuild(version, build);
            callback();
        }, error => this.urls.errorWrapper('Failed to get build', error));
    }

    makeRc(version: string, build: ModpackBuild) {
        // post request for rc
        this.httpClient.post(this.urls.apiUrl + `/modpack/makerc/${version}`, build).subscribe(
            () => { },
            error => this.urls.errorWrapper('Failed to make RC', error)
        );
    }

    rebuild(version: string, build: ModpackBuild) {
        // post request for rebuild
        this.httpClient.post(this.urls.apiUrl + `/modpack/rebuild/${version}`, build).subscribe(
            () => { },
            error => this.urls.errorWrapper('Failed to rebuild', error)
        );
    }

    cancel(callback: () => void) {
        // get request for build cancel
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/cancel`).subscribe(() => {
            callback();
        }, error => {
            callback();
            this.urls.errorWrapper('Failed to cancel build', error)
        });
    }
}
