import { Injectable } from '@angular/core';
import { DisplayNameService } from './displayName.service';
import * as moment from 'moment';

@Injectable()
export class ModpackBuildProcessService {

    constructor(private displayNameService: DisplayNameService) { }

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
}
