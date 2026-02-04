import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DocumentMetadata, FolderMetadata } from '@app/Models/Documents';
import { folderAnimations } from '@app/Services/animations.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateDocumentModalComponent, DocumentModalData } from '../../../modals/create-document-modal/create-document-modal.component';
import { ConfirmationModalComponent, ConfirmationModalData } from '@app/Modals/confirmation-modal/confirmation-modal.component';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UksfError } from '@app/Models/Response';
import { MessageModalComponent } from '@app/Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-docs-document',
    templateUrl: './docs-document.component.html',
    styleUrls: ['./docs-document.component.scss'],
    animations: [folderAnimations.indicatorRotate, folderAnimations.folderExpansion]
})
export class DocsDocumentComponent implements OnChanges {
    @Input('allDocumentMetadata') allFolderMetadata: FolderMetadata[];
    @Input('folderMetadata') folderMetadata: FolderMetadata;
    @Input('documentMetadata') documentMetadata: DocumentMetadata;
    @Output('refresh') refresh = new EventEmitter();
    @Output('expandFolder') expandFolder = new EventEmitter();
    hover: boolean = false;
    menuOpen: boolean = false;
    selected: boolean = false;

    constructor(private httpClient: HttpClient, private urlService: UrlService, private dialog: MatDialog, private route: ActivatedRoute, private router: Router) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.folderMetadata.isFirstChange() && changes.documentMetadata.isFirstChange()) {
            this.route.queryParams.subscribe({
                next: (params) => {
                    const folder = params.folder;
                    const document = params.document;

                    if (folder && document) {
                        this.selected = folder === this.folderMetadata?.id && document === this.documentMetadata?.id;
                        this.showSelfInFolderTree();
                    } else {
                        this.selected = false;
                    }
                }
            });
        }
    }

    selectDocument() {
        if (this.selected) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.router
            .navigate([], {
                relativeTo: this.route,
                queryParams: { folder: this.folderMetadata.id, document: this.documentMetadata.id }
            })
            .then();
    }

    close() {
        this.router
            .navigate([], {
                relativeTo: this.route,
                queryParams: { folder: null, document: null }
            })
            .then();
    }

    showSelfInFolderTree() {
        if (!this.selected) {
            return;
        }

        this.expandFolder.emit();
    }

    onMouseOver() {
        this.hover = true;
    }

    onMouseLeave() {
        this.hover = false;
    }

    menuOpened() {
        this.menuOpen = true;
    }

    menuClosed() {
        this.menuOpen = false;
    }

    editDocument() {
        this.dialog
            .open<CreateDocumentModalComponent, DocumentModalData>(CreateDocumentModalComponent, {
                data: {
                    folderMetadata: this.folderMetadata,
                    inheritedPermissions: this.documentMetadata.inheritedPermissions,
                    initialData: {
                        id: this.documentMetadata.id,
                        name: this.documentMetadata.name,
                        owner: this.documentMetadata.owner,
                        permissions: this.documentMetadata.permissions
                    }
                }
            })
            .afterClosed()
            .subscribe({
                next: (_) => {
                    this.refresh.emit();
                }
            });
    }

    deleteDocument() {
        this.dialog
            .open<ConfirmationModalComponent, ConfirmationModalData>(ConfirmationModalComponent, {
                data: { message: `Are you sure you want to delete '${this.documentMetadata.name}'` }
            })
            .afterClosed()
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.httpClient.delete(`${this.urlService.apiUrl}/docs/folders/${this.folderMetadata.id}/documents/${this.documentMetadata.id}`).subscribe({
                            next: () => {
                                this.refresh.emit();
                            },
                            error: (error: UksfError) => {
                                this.dialog.open(MessageModalComponent, {
                                    data: { message: error.error }
                                });

                                this.refresh.emit();
                            }
                        });
                    }
                }
            });
    }
}
