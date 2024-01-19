import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { DocumentMetadata, FolderMetadata } from '../../Models/Documents';
import { ActivatedRoute, Router } from '@angular/router';
import { UksfError } from '../../Models/Response';
import { MessageModalComponent } from '../../Modals/message-modal/message-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-docs-page',
    templateUrl: './docs-page.component.html',
    styleUrls: ['./docs-page.component.scss']
})
export class DocsPageComponent implements OnInit {
    allFolderMetadata: FolderMetadata[] = [];
    selectedDocumentMetadata: DocumentMetadata;

    constructor(private httpClient: HttpClient, private urls: UrlService, private route: ActivatedRoute, private router: Router, private dialog: MatDialog) {}

    ngOnInit(): void {
        this.getAllFoldersMetadata();
    }

    getAllFoldersMetadata() {
        this.httpClient.get(`${this.urls.apiUrl}/docs/folders`).subscribe({
            next: (allFolderMetadata: FolderMetadata[]) => {
                this.allFolderMetadata = allFolderMetadata;
                this.setSelectedDocument();
            },
            error: (error: UksfError) => {
                this.dialog
                    .open(MessageModalComponent, {
                        data: { message: error.error }
                    })
                    .afterClosed()
                    .subscribe(() => {
                        this.setSelectedDocument();
                    });
            }
        });
    }

    setSelectedDocument() {
        this.route.queryParams.subscribe((params) => {
            const folder = params.folder;
            const document = params.document;

            if (folder && document) {
                this.httpClient.get(`${this.urls.apiUrl}/docs/folders/${folder}/documents/${document}`).subscribe({
                    next: (documentMetadata: DocumentMetadata) => {
                        this.selectedDocumentMetadata = documentMetadata;
                    },
                    error: (error: UksfError) => {
                        this.dialog.open(MessageModalComponent, {
                            data: { message: error.error }
                        });

                        this.resetSelectedDocument();
                    }
                });
            } else {
                this.resetSelectedDocument();
            }
        });
    }

    resetSelectedDocument() {
        this.selectedDocumentMetadata = null;
        this.router
            .navigate([], {
                relativeTo: this.route,
                queryParams: { folder: null, document: null }
            })
            .then();
    }

    refresh() {
        this.getAllFoldersMetadata();
    }
}
