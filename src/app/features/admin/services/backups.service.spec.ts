import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { BackupsService } from './backups.service';
import { UrlService } from '@app/core/services/url.service';
import { BackupEntry, BackupEntryType } from '@app/features/admin/models/backup';

describe('BackupsService', () => {
    let service: BackupsService;
    let httpClient: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

    const entry: BackupEntry = {
        id: '5bd9daa3b1c98150403bccf6',
        path: 'C:\\Server\\Nginx',
        entryType: BackupEntryType.Folder,
        recursive: true,
        excludes: [],
        enabled: true
    };

    beforeEach(() => {
        httpClient = { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
        TestBed.configureTestingModule({
            providers: [BackupsService, { provide: HttpClient, useValue: httpClient }, { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } }]
        });
        service = TestBed.inject(BackupsService);
    });

    it('gets the selection', () => {
        httpClient.get.mockReturnValue(of([entry]));

        service.getEntries().subscribe((result) => expect(result).toEqual([entry]));

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/backups/entries');
    });

    it('adds an entry', () => {
        httpClient.put.mockReturnValue(of(entry));

        service.addEntry(entry).subscribe();

        expect(httpClient.put).toHaveBeenCalledWith('http://localhost:5500/backups/entries', entry, expect.anything());
    });

    it('updates an entry', () => {
        httpClient.patch.mockReturnValue(of(entry));

        service.updateEntry(entry).subscribe();

        expect(httpClient.patch).toHaveBeenCalledWith('http://localhost:5500/backups/entries', entry, expect.anything());
    });

    it('deletes an entry', () => {
        httpClient.delete.mockReturnValue(of(null));

        service.deleteEntry(entry.id).subscribe();

        expect(httpClient.delete).toHaveBeenCalledWith(`http://localhost:5500/backups/entries/${entry.id}`);
    });

    it('reads drives when no path is given', () => {
        httpClient.get.mockReturnValue(of([]));

        service.getTree().subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/backups/tree', { params: undefined });
    });

    it('reads children for a path', () => {
        httpClient.get.mockReturnValue(of([]));

        service.getTree('C:\\Server').subscribe();

        const [url, options] = httpClient.get.mock.calls[0];
        expect(url).toBe('http://localhost:5500/backups/tree');
        expect(options.params.get('path')).toBe('C:\\Server');
    });

    it('gets runs and triggers a run', () => {
        httpClient.get.mockReturnValue(of([]));
        httpClient.post.mockReturnValue(of({}));

        service.getRuns().subscribe();
        service.runNow().subscribe();

        expect(httpClient.get).toHaveBeenCalledWith('http://localhost:5500/backups/runs');
        expect(httpClient.post).toHaveBeenCalledWith('http://localhost:5500/backups/run', {});
    });
});
