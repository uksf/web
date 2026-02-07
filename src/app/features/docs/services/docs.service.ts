import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import {
    CreateDocumentRequest,
    CreateFolderRequest,
    DocumentContent,
    DocumentMetadata,
    FolderMetadata,
    UpdateDocumentContentRequest
} from '../models/documents';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable()
export class DocsService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getFolders(): Observable<FolderMetadata[]> {
        return this.httpClient.get<FolderMetadata[]>(`${this.urls.apiUrl}/docs/folders`);
    }

    getDocumentMetadata(folderId: string, documentId: string): Observable<DocumentMetadata> {
        return this.httpClient.get<DocumentMetadata>(`${this.urls.apiUrl}/docs/folders/${folderId}/documents/${documentId}`);
    }

    getDocumentContent(folderId: string, documentId: string): Observable<DocumentContent> {
        return this.httpClient.get<DocumentContent>(`${this.urls.apiUrl}/docs/folders/${folderId}/documents/${documentId}/content`);
    }

    updateDocumentContent(folderId: string, documentId: string, request: UpdateDocumentContentRequest): Observable<DocumentContent> {
        return this.httpClient.put<DocumentContent>(
            `${this.urls.apiUrl}/docs/folders/${folderId}/documents/${documentId}/content`,
            request,
            { headers: jsonHeaders }
        );
    }

    createFolder(request: CreateFolderRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/docs/folders`, request, { headers: jsonHeaders });
    }

    updateFolder(folderId: string, request: CreateFolderRequest): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/docs/folders/${folderId}`, request, { headers: jsonHeaders });
    }

    deleteFolder(folderId: string): Observable<unknown> {
        return this.httpClient.delete(`${this.urls.apiUrl}/docs/folders/${folderId}`);
    }

    createDocument(folderId: string, request: CreateDocumentRequest): Observable<unknown> {
        return this.httpClient.post(`${this.urls.apiUrl}/docs/folders/${folderId}/documents`, request, { headers: jsonHeaders });
    }

    updateDocument(folderId: string, documentId: string, request: CreateDocumentRequest): Observable<unknown> {
        return this.httpClient.put(`${this.urls.apiUrl}/docs/folders/${folderId}/documents/${documentId}`, request, { headers: jsonHeaders });
    }

    deleteDocument(folderId: string, documentId: string): Observable<unknown> {
        return this.httpClient.delete(`${this.urls.apiUrl}/docs/folders/${folderId}/documents/${documentId}`);
    }
}
