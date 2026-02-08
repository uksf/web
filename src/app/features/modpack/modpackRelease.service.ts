import { Injectable, OnDestroy } from '@angular/core';
import { ConnectionContainer, SignalRService } from '@app/core/services/signalr.service';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { ModpackRelease } from './models/modpack-release';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { NewModpackReleaseModalComponent } from './new-modpack-release-modal/new-modpack-release-modal.component';
import { UksfError } from '@app/shared/models/response';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';

@Injectable()
export class ModpackReleaseService implements OnDestroy {
    releases: ModpackRelease[] = [];
    private hubConnection: ConnectionContainer;

    constructor(private httpClient: HttpClient, private urls: UrlService, private signalrService: SignalRService, private dialog: MatDialog) {}

    ngOnDestroy(): void {
        this.disconnect();
    }

    connect(callback: () => void, newReleaseCallback: (string) => void) {
        this.getData(callback);

        this.hubConnection = this.signalrService.connect(`modpack`);
        this.hubConnection.connection.on('ReceiveRelease', (release: ModpackRelease) => {
            this.patchRelease(release);
            newReleaseCallback(release.version);
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

    getData(callback: () => void) {
        this.httpClient.get(this.urls.apiUrl + '/modpack/releases').subscribe({
            next: (releases: ModpackRelease[]) => {
                this.releases = releases;
                callback();
            }
        });
    }

    patchRelease(release: ModpackRelease) {
        const index = this.releases.findIndex((x) => x.version === release.version);
        if (index === -1) {
            this.releases.unshift(release);
        } else {
            this.releases.splice(index, 1, release);
        }
    }

    newRelease(callback: () => void) {
        if (this.releases.length === 0) {
            this.dialog.open(MessageModalComponent, { data: { message: "Can't create a new release, no previous releases were found" } });
            return;
        }

        this.dialog
            .open(NewModpackReleaseModalComponent, {
                data: { previousRelease: this.releases[0] }
            })
            .afterClosed()
            .subscribe({
                next: (result) => {
                    if (result) {
                        callback();
                    }
                }
            });
    }

    createNewRelease(version: string, callback: () => void) {
        this.httpClient.post(this.urls.apiUrl + `/modpack/releases/${version}`, {}).subscribe({
            next: () => {
                this.dialog.closeAll();
                this.dialog.open(MessageModalComponent, {
                    data: { message: `Version ${version} created` }
                });
                callback();
            },
            error: (error: UksfError) => {
                this.dialog.closeAll();
                this.dialog.open(MessageModalComponent, {
                    data: { message: error.error }
                });
            }
        });
    }

    release(version: string, callback: () => void) {
        this.httpClient.put(this.urls.apiUrl + `/modpack/releases/${version}`, {}).subscribe({
            next: () => {
                callback();
            }
        });
    }

    saveReleaseChanges(release: ModpackRelease, callback: () => void) {
        this.httpClient.patch(this.urls.apiUrl + `/modpack/releases/${release.version}`, release).subscribe({
            next: (release: ModpackRelease) => {
                this.patchRelease(release);
                callback();
            }
        });
    }

    regenerateChangelog(version: string, callback: (string) => void) {
        this.httpClient.put(this.urls.apiUrl + `/modpack/releases/${version}/changelog`, {}).subscribe({
            next: (release: ModpackRelease) => {
                this.patchRelease(release);
                callback(release.changelog);
            }
        });
    }
}
