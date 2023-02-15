import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { DocumentMetadata, FolderMetadata } from '../../Models/Documents';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-docs-page',
    templateUrl: './docs-page.component.html',
    styleUrls: ['./docs-page.component.scss']
})
export class DocsPageComponent implements OnInit {
    allFolderMetadata: FolderMetadata[] = [];
    selectedDocumentMetadata: DocumentMetadata;

    constructor(private httpClient: HttpClient, private urls: UrlService, private route: ActivatedRoute) {}

    ngOnInit(): void {
        this.getAllFoldersMetadata();

        this.route.queryParams.subscribe((params) => {
            const folder = params.folder;
            const document = params.document;

            if (folder && document) {
                this.httpClient.get(`${this.urls.apiUrl}/docs/folders/${folder}/documents/${document}`).subscribe({
                    next: (documentMetadata: DocumentMetadata) => {
                        this.selectedDocumentMetadata = documentMetadata;
                    },
                    error: () => {}
                });
            } else {
                this.selectedDocumentMetadata = null;
            }
        });
    }

    getAllFoldersMetadata() {
        this.httpClient.get(`${this.urls.apiUrl}/docs/folders`).subscribe({
            next: (allFolderMetadata: FolderMetadata[]) => {
                this.allFolderMetadata = allFolderMetadata;
            },
            error: () => {}
        });
    }

    refresh() {
        this.getAllFoldersMetadata();
    }
}
