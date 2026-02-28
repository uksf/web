import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { DocsService } from './docs.service';
import { UrlService } from '@app/core/services/url.service';
import { of } from 'rxjs';

describe('DocsService', () => {
    let service: DocsService;
    let mockHttpClient: any;

    beforeEach(() => {
        mockHttpClient = {
            get: vi.fn().mockReturnValue(of([])),
            post: vi.fn().mockReturnValue(of(null)),
            put: vi.fn().mockReturnValue(of(null)),
            delete: vi.fn().mockReturnValue(of(null))
        };
        TestBed.configureTestingModule({
            providers: [
                DocsService,
                { provide: HttpClient, useValue: mockHttpClient },
                { provide: UrlService, useValue: { apiUrl: 'http://localhost:5500' } },
            ]
        });
        service = TestBed.inject(DocsService);
    });

    it('getFolders calls correct endpoint', () => {
        service.getFolders().subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/docs/folders');
    });

    it('getDocumentMetadata calls correct endpoint', () => {
        service.getDocumentMetadata('f1', 'd1').subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/docs/folders/f1/documents/d1');
    });

    it('getDocumentContent calls correct endpoint', () => {
        service.getDocumentContent('f1', 'd1').subscribe();
        expect(mockHttpClient.get).toHaveBeenCalledWith('http://localhost:5500/docs/folders/f1/documents/d1/content');
    });

    it('updateDocumentContent calls correct endpoint', () => {
        const request = { newText: 'test', lastKnownUpdated: new Date() };
        service.updateDocumentContent('f1', 'd1', request).subscribe();
        expect(mockHttpClient.put).toHaveBeenCalledWith(
            'http://localhost:5500/docs/folders/f1/documents/d1/content',
            request,
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('createFolder calls correct endpoint', () => {
        const request = { parent: 'p1', name: 'test', owner: 'o1', permissions: {} as any };
        service.createFolder(request).subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/docs/folders',
            request,
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('updateFolder calls correct endpoint', () => {
        const request = { parent: 'p1', name: 'test', owner: 'o1', permissions: {} as any };
        service.updateFolder('f1', request).subscribe();
        expect(mockHttpClient.put).toHaveBeenCalledWith(
            'http://localhost:5500/docs/folders/f1',
            request,
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('deleteFolder calls correct endpoint', () => {
        service.deleteFolder('f1').subscribe();
        expect(mockHttpClient.delete).toHaveBeenCalledWith('http://localhost:5500/docs/folders/f1');
    });

    it('createDocument calls correct endpoint', () => {
        const request = { name: 'test', owner: 'o1', permissions: {} as any };
        service.createDocument('f1', request).subscribe();
        expect(mockHttpClient.post).toHaveBeenCalledWith(
            'http://localhost:5500/docs/folders/f1/documents',
            request,
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('updateDocument calls correct endpoint', () => {
        const request = { name: 'test', owner: 'o1', permissions: {} as any };
        service.updateDocument('f1', 'd1', request).subscribe();
        expect(mockHttpClient.put).toHaveBeenCalledWith(
            'http://localhost:5500/docs/folders/f1/documents/d1',
            request,
            { headers: expect.objectContaining({ lazyInit: expect.anything() }) }
        );
    });

    it('deleteDocument calls correct endpoint', () => {
        service.deleteDocument('f1', 'd1').subscribe();
        expect(mockHttpClient.delete).toHaveBeenCalledWith('http://localhost:5500/docs/folders/f1/documents/d1');
    });
});
