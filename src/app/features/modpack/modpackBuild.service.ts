import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { ModpackHubService } from './services/modpack-hub.service';
import { ModpackBuild } from './models/modpack-build';

@Injectable()
export class ModpackBuildService implements OnDestroy {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);
    private modpackHub = inject(ModpackHubService);

    builds: ModpackBuild[] = [];
    private onReceiveBuild: ((build: ModpackBuild) => void) | null = null;
    private reconnectSubscription: Subscription | null = null;

    ngOnDestroy(): void {
        this.disconnect();
    }

    connect(callback: () => void, newBuildCallback: (string) => void) {
        this.getData(callback);

        this.modpackHub.connect();
        this.onReceiveBuild = (build: ModpackBuild) => {
            this.patchBuild(build);
            newBuildCallback(build.id);
        };
        this.modpackHub.on('ReceiveBuild', this.onReceiveBuild);
        this.reconnectSubscription = this.modpackHub.reconnected$.subscribe({
            next: () => {
                this.getData(callback);
            }
        });
    }

    disconnect() {
        this.reconnectSubscription?.unsubscribe();
        this.reconnectSubscription = null;
        if (this.onReceiveBuild) {
            this.modpackHub.off('ReceiveBuild', this.onReceiveBuild);
            this.onReceiveBuild = null;
        }
        this.modpackHub.disconnect();
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
