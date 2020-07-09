import { Injectable, OnDestroy } from '@angular/core';
import { SignalRService, ConnectionContainer } from './signalr.service';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';

@Injectable()
export class ModpackBuildService implements OnDestroy {
    private hubConnection: ConnectionContainer;
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
    }

    sortBuilds() {
        this.builds.sort((a: ModpackBuild, b: ModpackBuild) => a.buildNumber > b.buildNumber ? -1 : a.buildNumber < b.buildNumber ? 1 : 0);
    }

    patchBuild(build: ModpackBuild) {
        const index = this.builds.findIndex(x => x.id === build.id);
        if (index === -1) {
            this.builds.unshift(build);
        } else {
            this.builds.splice(index, 1, build);
        }

        this.sortBuilds();
    }

    getData(callback: () => void) {
        // get request for all builds
        this.httpClient.get(this.urls.apiUrl + '/modpack/builds').subscribe((builds: ModpackBuild[]) => {
            this.builds = builds;
            callback();
        }, error => this.urls.errorWrapper('Failed to get releases', error));
    }
}
