import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, first } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { GameDataExport, GameDataFile } from '../models/game-data-export';

@Injectable({ providedIn: 'root' })
export class GameDataExportService {
    private http = inject(HttpClient);
    private urls = inject(UrlService);

    list(): Observable<GameDataExport[]> {
        return this.http.get<GameDataExport[]>(`${this.urls.apiUrl}/modpack/gamedata`).pipe(first());
    }

    download(version: string, file: GameDataFile): Observable<Blob> {
        return this.http
            .get(`${this.urls.apiUrl}/modpack/gamedata/${version}/${file}`, { responseType: 'blob' })
            .pipe(first());
    }
}
