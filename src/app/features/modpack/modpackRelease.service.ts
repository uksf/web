import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { merge, of, Subject, switchMap, takeUntil } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { ModpackHubService } from './services/modpack-hub.service';
import { ModpackRelease } from './models/modpack-release';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { NewModpackReleaseModalComponent } from './new-modpack-release-modal/new-modpack-release-modal.component';
import { UksfError } from '@app/shared/models/response';
import { MatDialog } from '@angular/material/dialog';

@Injectable()
export class ModpackReleaseService implements OnDestroy {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);
    private modpackHub = inject(ModpackHubService);
    private dialog = inject(MatDialog);

    releases: ModpackRelease[] = [];
    private onReceiveRelease: ((release: ModpackRelease) => void) | null = null;
    private readonly disconnect$ = new Subject<void>();

    ngOnDestroy(): void {
        this.disconnect();
    }

    connect(callback: () => void, newReleaseCallback: (version: string) => void) {
        this.modpackHub.connect();
        this.onReceiveRelease = (release: ModpackRelease) => {
            this.patchRelease(release);
            newReleaseCallback(release.version);
        };
        this.modpackHub.on('ReceiveRelease', this.onReceiveRelease);

        merge(of(undefined), this.modpackHub.reconnected$)
            .pipe(
                switchMap(() => this.httpClient.get<ModpackRelease[]>(this.urls.apiUrl + '/modpack/releases')),
                takeUntil(this.disconnect$)
            )
            .subscribe({
                next: (releases) => {
                    this.releases = releases;
                    callback();
                }
            });
    }

    disconnect() {
        this.disconnect$.next();
        if (this.onReceiveRelease) {
            this.modpackHub.off('ReceiveRelease', this.onReceiveRelease);
            this.onReceiveRelease = null;
        }
        this.modpackHub.disconnect();
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

    regenerateChangelog(version: string, callback: (changelog: string) => void) {
        this.httpClient.put(this.urls.apiUrl + `/modpack/releases/${version}/changelog`, {}).subscribe({
            next: (release: ModpackRelease) => {
                this.patchRelease(release);
                callback(release.changelog);
            }
        });
    }
}
