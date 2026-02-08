import { Injectable, Injector } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LoggingService } from './logging.service';

interface AppSettings {
    apiUrl: string;
    environment: string;
    debugForms?: boolean;
}

@Injectable()
export class AppSettingsService {
    private httpClient: HttpClient;
    private appSettings: AppSettings;

    constructor(handler: HttpBackend, private injector: Injector) {
        this.httpClient = new HttpClient(handler);
    }

    public appSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
        return this.appSettings[key];
    }

    public async loadAppSettings(): Promise<void> {
        const observable = this.httpClient.get<AppSettings>('assets/dist/appSettings.json');
        return await firstValueFrom(observable).then((settings) => {
            this.appSettings = settings;

            if (this.appSetting('environment') === Environments.Development) {
                this.injector.get(LoggingService).debug('AppSettings', this.appSettings);
            }
        });
    }
}

export class Environments {
    public static Development: string = 'Development';
    public static Production: string = 'Production';
}
