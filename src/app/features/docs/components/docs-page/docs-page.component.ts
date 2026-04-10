import { Component, OnInit, inject } from '@angular/core';
import { first, takeUntil } from 'rxjs/operators';
import { DocumentMetadata, FolderMetadata } from '@app/features/docs/models/documents';
import { DocsService } from '../../services/docs.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UksfError } from '@app/shared/models/response';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { DestroyableComponent } from '@app/shared/components';
import { DocsSidebarComponent } from '../docs-sidebar/docs-sidebar.component';
import { DocsContentComponent } from '../docs-content/docs-content.component';

@Component({
    selector: 'app-docs-page',
    templateUrl: './docs-page.component.html',
    styleUrls: ['./docs-page.component.scss'],
    imports: [DocsSidebarComponent, DocsContentComponent]
})
export class DocsPageComponent extends DestroyableComponent implements OnInit {
    private docsService = inject(DocsService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private dialog = inject(MatDialog);

    allFolderMetadata: FolderMetadata[] = [];
    selectedDocumentMetadata: DocumentMetadata;
    expandedFolderIds = new Set<string>();

    ngOnInit(): void {
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe({
            next: (params) => {
                this.handleQueryParams(params);
            }
        });
        this.getAllFoldersMetadata();
    }

    getAllFoldersMetadata() {
        this.docsService
            .getFolders()
            .pipe(first())
            .subscribe({
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
            this.docsService
                .getDocumentMetadata(folder, document)
                .pipe(first())
                .subscribe({
                    next: (documentMetadata: DocumentMetadata) => {
                        this.selectedDocumentMetadata = documentMetadata;
                        this.expandedFolderIds = this.getAncestorFolderIds(documentMetadata.folder);
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

    private getAncestorFolderIds(folderId: string): Set<string> {
        const ids = new Set<string>();
        let currentId = folderId;
        const folderMap = new Map(this.allFolderMetadata.map(f => [f.id, f]));
        while (currentId && currentId !== '000000000000000000000000') {
            ids.add(currentId);
            const folder = folderMap.get(currentId);
            if (!folder) break;
            currentId = folder.parent;
        }
        return ids;
    }

    resetSelectedDocument() {
        this.selectedDocumentMetadata = null;
        this.expandedFolderIds = new Set();
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
