import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { InstallWorkshopModData, WorkshopMod, WorkshopModUpdatedDate } from '../models/workshop-mod';

@Injectable()
export class WorkshopService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getMods(): Observable<WorkshopMod[]> {
        return this.httpClient.get<WorkshopMod[]>(`${this.urls.apiUrl}/workshop`);
    }

    getMod(id: string): Observable<WorkshopMod> {
        return this.httpClient.get<WorkshopMod>(`${this.urls.apiUrl}/workshop/${id}`);
    }

    getModUpdatedDate(steamId: string): Observable<WorkshopModUpdatedDate> {
        return this.httpClient.get<WorkshopModUpdatedDate>(`${this.urls.apiUrl}/workshop/${steamId}/updatedDate`);
    }

    installMod(data: InstallWorkshopModData): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/workshop`, {
            steamId: data.steamId,
            rootMod: data.rootMod,
            folderName: data.folderName
        });
    }

    resolveIntervention(steamId: string, selectedPbos: string[]): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/workshop/${steamId}/resolve`, { selectedPbos });
    }

    updateMod(steamId: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/workshop/${steamId}/update`, {});
    }

    uninstallMod(steamId: string): Observable<void> {
        return this.httpClient.post<void>(`${this.urls.apiUrl}/workshop/${steamId}/uninstall`, {});
    }

    deleteMod(steamId: string): Observable<void> {
        return this.httpClient.delete<void>(`${this.urls.apiUrl}/workshop/${steamId}`);
    }
}
