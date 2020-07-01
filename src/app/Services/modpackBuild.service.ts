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
    private build: ModpackBuild;
    buildsReleases: ModpackBuildRelease[] = [];

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
            console.log(buildRelease);

            // receives new build release
            const index = this.buildsReleases.findIndex(x => x.version === buildRelease.version);
            if (index !== -1) {
                this.buildsReleases.splice(index, 1, buildRelease);
            } else {
                this.buildsReleases.unshift(buildRelease);
            }
        });
        this.hubConnection.connection.on('ReceiveBuild', (version: string, build: ModpackBuild) => {
            console.log(version);
            console.log(build);

            // receives new or updated build
            const buildRelease = this.buildsReleases.find(x => x.version === version);
            const index = buildRelease.builds.findIndex(x => x.buildNumber === build.buildNumber);
            if (index !== -1) {
                buildRelease.builds.splice(index, 1, build);
            } else {
                buildRelease.builds.unshift(build);
            }
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

    connectToBuildLog(version: string, build: ModpackBuild) {
        this.build = build;
        this.getBuildLogData(version);

        // Don't connect if last step has finished
        if (this.build.steps[this.build.steps.length - 1].endTime === new Date('20000101')) {
            return;
        }

        this.buildConnection = this.signalrService.connect(`builds?version=${version}.${this.build.buildNumber}`);
        this.buildConnection.connection.on('ReceiveBuildStep', (step: ModpackBuildStep) => {
            // get whole step in order as they complete (try replacing step, see how UI responds)
            this.build.steps.splice(step.index, 1, step);
        });
        this.buildConnection.reconnectEvent.subscribe(() => {
            this.getBuildLogData(version);
        });
    }

    disconnectFromBuildLog() {
        if (this.buildConnection !== undefined) {
            this.buildConnection.connection.stop();
        }
    }

    getBuildsData(callback: () => void = null) {
        // get request for all releases
        this.httpClient.get(this.urls.apiUrl + '/modpack/builds').subscribe((buildsReleases: ModpackBuildRelease[]) => {
            this.buildsReleases = buildsReleases;
            if (callback) {
                callback();
            }
        }, error => this.urls.errorWrapper('Failed to get releases', error));
    }

    getBuildLogData(version: string) {
        // get request for build
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${version}/${this.build.buildNumber}`).subscribe((build: ModpackBuild) => {
            this.build = build;
        }, error => this.urls.errorWrapper('Failed to get build', error));
    }
}
