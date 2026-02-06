import { Injectable } from '@angular/core';
import { AppSettingsService } from './app-settings.service';

@Injectable()
export class UrlService {
    public apiUrl = 'http://localhost:5500';

    constructor(appSettingsService: AppSettingsService) {
        this.apiUrl = appSettingsService.appSetting('apiUrl');
    }
}
