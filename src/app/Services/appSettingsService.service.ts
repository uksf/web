import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';

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
        return this.httpClient
            .get('assets/dist/appSettings.json')
            .pipe((settings) => settings)
            .toPromise()
            .then((settings) => {
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
