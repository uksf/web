import { Injectable } from '@angular/core';
import { DisplayNameService } from './displayName.service';
import * as moment from 'moment';
import { ModpackBuild } from 'app/Models/ModpackBuild';
import { HttpClient } from '@angular/common/http';
import { UrlService } from './url.service';
import { MatDialog } from '@angular/material';
import { NewModpackBuildModalComponent } from 'app/Modals/new-modpack-build/new-modpack-build-modal.component';
import { MessageModalComponent } from 'app/Modals/message-modal/message-modal.component';
import {ModpackBuildStep} from '../Models/ModpackBuildStep';

@Injectable()
export class ModpackBuildProcessService {
    branches: string[] = [];

    constructor(
        private displayNameService: DisplayNameService,
        private httpClient: HttpClient,
        private urls: UrlService,
        private dialog: MatDialog
    ) {
        this.httpClient.get(this.urls.apiUrl + '/github/branches').subscribe((branches: string[]) => {
            this.branches = branches;
            this.branches.unshift('No branch');
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
        this.displayNameService.getName(id).then((name: string) => {
            callback(name);
        }).catch(() => {
            callbackError();
        });
    }

    getBuildData(id: string, callback: (arg0: ModpackBuild) => void) {
        // get request for build
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${id}`).subscribe((build: ModpackBuild) => {
            callback(build);
        }, error => this.urls.errorWrapper('Failed to get build', error));
    }

    getBuildStepData(id: string, index: number, callback: (arg0: ModpackBuildStep) => void) {
        // get request for build
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${id}/step/${index}`).subscribe((step: ModpackBuildStep) => {
            callback(step);
        }, error => this.urls.errorWrapper('Failed to get build step', error));
    }

    newBuild(callback: () => void) {
        this.dialog.open(NewModpackBuildModalComponent, {
            data: { branches: this.branches }
        }).componentInstance.runEvent.subscribe((reference: string) => {
            // get request for new build
            this.httpClient.get(this.urls.apiUrl + `/modpack/newbuild/${reference}`).subscribe(() => {
                callback();
            }, error => {
                this.dialog.open(MessageModalComponent, {
                    data: { message: error.error }
                });
            });
        });
    }

    rebuild(build: ModpackBuild, callback: () => void) {
        // get request for rebuild
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${build.id}/rebuild`).subscribe(
            () => {
                callback();
            },
            error => this.urls.errorWrapper('Failed to rebuild', error)
        );
    }

    cancel(build: ModpackBuild, errorCallback: () => void) {
        // get request for build cancel
        this.httpClient.get(this.urls.apiUrl + `/modpack/builds/${build.id}/cancel`).subscribe(() => {}, error => {
            errorCallback();
            this.urls.errorWrapper('Failed to cancel build', error)
        });
    }
}
