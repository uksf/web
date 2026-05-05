import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GameDataExportService } from './game-data-export.service';
import { UrlService } from '@app/core/services/url.service';

describe('GameDataExportService', () => {
    let service: GameDataExportService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                GameDataExportService,
                { provide: UrlService, useValue: { apiUrl: 'http://api' } },
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(GameDataExportService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('list() requests GET /modpack/gamedata', () => {
        let result: any = null;
        service.list().subscribe((r) => (result = r));
        const req = http.expectOne('http://api/modpack/gamedata');
        expect(req.request.method).toBe('GET');
        req.flush([{ modpackVersion: '5.23.9', hasConfig: true, hasCbaSettings: true, hasCbaSettingsReference: true }]);
        expect(result.length).toBe(1);
    });

    it('download() requests GET /modpack/gamedata/{v}/{f} as blob', () => {
        let blob: Blob | null = null;
        service.download('5.23.9', 'cba-settings').subscribe((b) => (blob = b));
        const req = http.expectOne('http://api/modpack/gamedata/5.23.9/cba-settings');
        expect(req.request.method).toBe('GET');
        expect(req.request.responseType).toBe('blob');
        req.flush(new Blob(['x']));
        expect(blob).toBeInstanceOf(Blob);
    });
});
