import { Injectable, OnDestroy } from '@angular/core';
import { SignalRService, ConnectionContainer } from './signalr.service';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { ModpackBuildStep } from 'app/Models/ModpackBuildStep';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { Observable } from 'rxjs/internal/Observable';

@Injectable()
export class ModpackBuildService implements OnDestroy {
    private hubConnection: ConnectionContainer;
    private buildConnection: ConnectionContainer;
    builds: ModpackBuild[] = [];

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
        this.hubConnection.connection.on('ReceiveBuild', (build: ModpackBuild) => {
            console.log(build);

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

    sortBuilds() {
        this.builds.sort((a: ModpackBuild, b: ModpackBuild) => a.buildNumber > b.buildNumber ? -1 : a.buildNumber < b.buildNumber ? 1 : 0);
    }

    // TODO: build not updating on complete
    patchBuild(build: ModpackBuild) {
        const index = this.builds.findIndex(x => x.id === build.id);
        if (index === -1) {
            this.builds.unshift(build);
        } else {
            this.builds.splice(index, 1, build);
        }

        this.sortBuilds();
    }

    patchStep(build: ModpackBuild, step: ModpackBuildStep) {
        const index = this.builds.findIndex(x => x.id === build.id);
        if (index === -1) {
            return;
        }

        this.builds[index].steps.splice(step.index, 1, step);
    }

    getData(callback: () => void) {
        // get request for all builds
        this.httpClient.get(this.urls.apiUrl + '/modpack/builds').subscribe((builds: ModpackBuild[]) => {
            this.builds = builds;
            callback();
        }, error => this.urls.errorWrapper('Failed to get releases', error));
    }

    getBuildLogData(id: string, callback: () => void) {
        // get request for build
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${id}`).subscribe((build: ModpackBuild) => {
            this.patchBuild(build);
            callback();
        }, error => this.urls.errorWrapper('Failed to get build', error));
    }

    // TODO: new build form
    newBuild() {
        // post request for rebuild
        // this.httpClient.post(this.urls.apiUrl + `/modpack/rebuild/${version}`, build).subscribe(
        //     () => { },
        //     error => this.urls.errorWrapper('Failed to rebuild', error)
        // );
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
