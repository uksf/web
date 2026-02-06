import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { DocumentMetadata, FolderMetadata } from '@app/features/docs/models/documents';
import { ActivatedRoute, Router } from '@angular/router';
import { UksfError } from '@app/shared/models/response';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'app-docs-page',
    templateUrl: './docs-page.component.html',
    styleUrls: ['./docs-page.component.scss']
})
export class DocsPageComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    allFolderMetadata: FolderMetadata[] = [];
    selectedDocumentMetadata: DocumentMetadata;

    constructor(private httpClient: HttpClient, private urls: UrlService, private route: ActivatedRoute, private router: Router, private dialog: MatDialog) {}

    ngOnInit(): void {
        this.getAllFoldersMetadata();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getAllFoldersMetadata() {
        this.httpClient.get(`${this.urls.apiUrl}/docs/folders`).pipe(takeUntil(this.destroy$)).subscribe({
            next: (allFolderMetadata: FolderMetadata[]) => {
                this.allFolderMetadata = allFolderMetadata;
                this.setSelectedDocument();
            },
            error: () => {
                this.setSelectedDocument();
            }
        });
    }

    setSelectedDocument() {
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe({
            next: (params) => {
                const folder = params.folder;
                const document = params.document;

                if (folder && document) {
                    this.httpClient.get(`${this.urls.apiUrl}/docs/folders/${folder}/documents/${document}`).pipe(takeUntil(this.destroy$)).subscribe({
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
