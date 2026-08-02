import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { BackupEntry, BackupRun, BackupTreeNode } from '@app/features/admin/models/backup';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable()
export class BackupsService {
    private httpClient = inject(HttpClient);
    private urls = inject(UrlService);

    getEntries(): Observable<BackupEntry[]> {
        return this.httpClient.get<BackupEntry[]>(`${this.urls.apiUrl}/backups/entries`);
    }

    addEntry(entry: BackupEntry): Observable<BackupEntry> {
        return this.httpClient.put<BackupEntry>(`${this.urls.apiUrl}/backups/entries`, entry, { headers: jsonHeaders });
    }

    updateEntry(entry: BackupEntry): Observable<BackupEntry> {
        return this.httpClient.patch<BackupEntry>(`${this.urls.apiUrl}/backups/entries`, entry, { headers: jsonHeaders });
    }

    deleteEntry(id: string): Observable<unknown> {
        return this.httpClient.delete(`${this.urls.apiUrl}/backups/entries/${id}`);
    }

    getTree(path?: string): Observable<BackupTreeNode[]> {
        const params = path ? new HttpParams().set('path', path) : undefined;
        return this.httpClient.get<BackupTreeNode[]>(`${this.urls.apiUrl}/backups/tree`, { params });
    }

    getRuns(): Observable<BackupRun[]> {
        return this.httpClient.get<BackupRun[]>(`${this.urls.apiUrl}/backups/runs`);
    }

    runNow(): Observable<BackupRun> {
        return this.httpClient.post<BackupRun>(`${this.urls.apiUrl}/backups/run`, {});
    }
}
