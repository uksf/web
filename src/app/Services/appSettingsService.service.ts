import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AppSettingsService {
    private httpClient: HttpClient;
    private appSettings: any;

    constructor(handler: HttpBackend) {
        this.httpClient = new HttpClient(handler);
    }

    public appSetting(key: string) {
        return this.appSettings[key];
    }

    public async loadAppSettings(): Promise<any> {
        const observable = this.httpClient.get('assets/dist/appSettings.json').pipe((settings) => settings);
        return await firstValueFrom(observable).then((settings) => {
            this.appSettings = settings;

            if (this.appSetting('environment') === Environments.Development) {
                console.log(this.appSettings);
            }
        });
    }
}

export class Environments {
    public static Development: string = 'Development';
    public static Production: string = 'Production';
}
