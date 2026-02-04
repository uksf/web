import { Injectable, OnDestroy } from '@angular/core';
import { ConnectionContainer, SignalRService } from '@app/Services/signalr.service';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { ModpackBuild } from './models/ModpackBuild';

@Injectable()
export class ModpackBuildService implements OnDestroy {
    private hubConnection: ConnectionContainer;
    builds: ModpackBuild[] = [];

    constructor(private httpClient: HttpClient, private urls: UrlService, private signalrService: SignalRService) {}

    ngOnDestroy(): void {
        this.disconnect();
    }

    connect(callback: () => void, newBuildCallback: (string) => void) {
        this.getData(callback);

        this.hubConnection = this.signalrService.connect(`modpack`);
        this.hubConnection.connection.on('ReceiveBuild', (build: ModpackBuild) => {
            this.patchBuild(build);
            newBuildCallback(build.id);
        });
        this.hubConnection.reconnectEvent.subscribe({
            next: () => {
                this.getData(callback);
            }
        });
    }

    disconnect() {
        if (this.hubConnection !== undefined) {
            this.hubConnection.connection.stop();
        }
    }

    sortBuilds() {
        this.builds.sort((a: ModpackBuild, b: ModpackBuild) => (a.buildNumber > b.buildNumber ? -1 : a.buildNumber < b.buildNumber ? 1 : 0));
    }

    patchBuild(build: ModpackBuild) {
        const index = this.builds.findIndex((x) => x.id === build.id);
        if (index === -1) {
            this.builds.unshift(build);
        } else {
            this.builds.splice(index, 1, build);
        }

        this.sortBuilds();
    }

    getData(callback: () => void) {
        // get request for all builds
        this.httpClient.get(this.urls.apiUrl + '/modpack/builds').subscribe({
            next: (builds: ModpackBuild[]) => {
                this.builds = builds;
                callback();
            }
        });
    }
}
