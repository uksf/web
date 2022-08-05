import { Injectable } from '@angular/core';
import { AppSettingsService } from './appSettingsService.service';

@Injectable()
export class UrlService {
    public apiUrl = 'http://host.docker.internal:5500';

    constructor(appSettingsService: AppSettingsService) {
        this.apiUrl = appSettingsService.appSetting('apiUrl');
    }
}
