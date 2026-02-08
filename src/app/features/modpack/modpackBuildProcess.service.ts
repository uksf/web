import { Injectable } from '@angular/core';
import { DisplayNameService } from '@app/shared/services/display-name.service';
import moment from 'moment';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { NewBuild } from './models/new-build';
import { ModpackBuild } from './models/modpack-build';
import { NewModpackBuildModalComponent } from './new-modpack-build-modal/new-modpack-build-modal.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';

@Injectable()
export class ModpackBuildProcessService {
    branches: string[] = [];

    constructor(private displayNameService: DisplayNameService, private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog) {}

    getBranches() {
        this.httpClient.get(this.urls.apiUrl + '/github/branches').subscribe({
            next: (branches: string[]) => {
                this.branches = branches;
                this.branches.unshift('No branch');
            }
        });
    }

    duration(startTime: Date, endTime: Date): string {
        const diff = moment(endTime).diff(moment(startTime));
        return moment(diff).format('m[m] ss[s]');
    }

    branch(branch: string): string {
        return branch.replace('refs/heads/', '');
    }

    getBuilderName(id: string, callback: (arg0: string) => void, callbackError: () => void) {
        this.displayNameService
            .getName(id)
            .then((name: string) => {
                callback(name);
            })
            .catch(() => {
                callbackError();
            });
    }

    getBuildData(id: string, callback: (arg0: ModpackBuild) => void) {
        // get request for build
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${id}`).subscribe({
            next: (build: ModpackBuild) => {
                callback(build);
            }
        });
    }

    newBuild(callback: () => void) {
        this.dialog
            .open(NewModpackBuildModalComponent, {
                data: { branches: this.branches }
            })
            .afterClosed()
            .subscribe({
                next: (newBuild: NewBuild) => {
                    if (newBuild) {
                        // get request for new build
                        this.httpClient.post(this.urls.apiUrl + `/modpack/newbuild`, newBuild).subscribe({
                            next: () => {
                                callback();
                            },
                            error: (error) => {
                                this.dialog.open(MessageModalComponent, {
                                    data: { message: error.error }
                                });
                            }
                        });
                    }
                }
            });
    }

    rebuild(build: ModpackBuild, callback: () => void) {
        this.httpClient.post(this.urls.apiUrl + `/modpack/builds/${build.id}/rebuild`, null).subscribe({
            next: () => {
                callback();
            }
        });
    }

    cancel(build: ModpackBuild, errorCallback: () => void) {
        this.httpClient.post(this.urls.apiUrl + `/modpack/builds/${build.id}/cancel`, null).subscribe({
            next: () => {},
            error: () => {
                errorCallback();
            }
        });
    }
}
