import { Component, OnInit } from '@angular/core';
import { first, takeUntil } from 'rxjs/operators';
import { DocumentMetadata, FolderMetadata } from '@app/features/docs/models/documents';
import { DocsService } from '../../services/docs.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UksfError } from '@app/shared/models/response';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { DestroyableComponent } from '@app/shared/components';

@Component({
    selector: 'app-docs-page',
    templateUrl: './docs-page.component.html',
    styleUrls: ['./docs-page.component.scss']
})
export class DocsPageComponent extends DestroyableComponent implements OnInit {
    allFolderMetadata: FolderMetadata[] = [];
    selectedDocumentMetadata: DocumentMetadata;

    constructor(private docsService: DocsService, private route: ActivatedRoute, private router: Router, private dialog: MatDialog) {
        super();
    }

    ngOnInit(): void {
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe({
            next: (params) => {
                this.handleQueryParams(params);
            }
        });
        this.getAllFoldersMetadata();
    }

    getAllFoldersMetadata() {
        this.docsService.getFolders().pipe(first()).subscribe({
            next: (allFolderMetadata: FolderMetadata[]) => {
                this.allFolderMetadata = allFolderMetadata;
                this.handleQueryParams(this.route.snapshot.queryParams);
            },
            error: () => {
                this.handleQueryParams(this.route.snapshot.queryParams);
            }
        });
    }

    private handleQueryParams(params: Record<string, string>) {
        const folder = params.folder;
        const document = params.document;

        if (folder && document) {
            this.docsService.getDocumentMetadata(folder, document).pipe(first()).subscribe({
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
