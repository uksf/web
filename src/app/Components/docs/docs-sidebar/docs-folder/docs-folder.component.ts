import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DocumentMetadata, FolderMetadata } from '../../../../Models/Documents';
import { folderAnimations } from '../../../../Services/animations.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateDocumentModalComponent, DocumentModalData } from '../../../../Modals/docs/create-document-modal/create-document-modal.component';
import { ConfirmationModalComponent, ConfirmationModalData } from '../../../../Modals/confirmation-modal/confirmation-modal.component';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../../Services/url.service';
import { CreateFolderModalComponent, FolderModalData } from '../../../../Modals/docs/create-folder-modal/create-folder-modal.component';
import { UksfError } from '../../../../Models/Response';
import { MessageModalComponent } from '../../../../Modals/message-modal/message-modal.component';

@Component({
    selector: 'app-docs-folder',
    templateUrl: './docs-folder.component.html',
    styleUrls: ['./docs-folder.component.scss'],
    animations: [folderAnimations.indicatorRotate, folderAnimations.folderExpansion]
})
export class DocsFolderComponent {
    @Input('allDocumentMetadata') allFolderMetadata: FolderMetadata[];
    @Input('folderMetadata') folderMetadata: FolderMetadata;
    @Output('refresh') refresh = new EventEmitter();
    @Output('expandFolder') expandFolder = new EventEmitter();
    expanded: boolean = false;
    hover: boolean = false;
    menuOpen: boolean = false;

    constructor(private httpClient: HttpClient, private urlService: UrlService, private dialog: MatDialog) {}

    trackByFolderId(_: any, folderMetadata: FolderMetadata) {
        return folderMetadata.id;
    }

    trackByDocumentId(_: any, documentMetadata: DocumentMetadata) {
        return documentMetadata.id;
    }

    toggle(event) {
        this.expanded = !this.expanded;

        event.stopPropagation();
    }

    expandSelf() {
        setTimeout((_) => {
            this.expanded = true;
            this.expandFolder.emit();
        });
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

    addFolder() {
        this.dialog
            .open<CreateFolderModalComponent, FolderModalData>(CreateFolderModalComponent, {
                data: {
                    parent: this.folderMetadata.id,
                    inheritedPermissions: this.folderMetadata.inheritedPermissions
                }
            })
            .afterClosed()
            .subscribe((_) => {
                this.expandSelf();
                this.refresh.emit();
            });
    }

    editFolder() {
        this.dialog
            .open<CreateFolderModalComponent, FolderModalData>(CreateFolderModalComponent, {
                data: {
                    parent: this.folderMetadata.parent,
                    inheritedPermissions: this.folderMetadata.inheritedPermissions,
                    initialData: {
                        id: this.folderMetadata.id,
                        name: this.folderMetadata.name,
                        owner: this.folderMetadata.owner,
                        roleBasedPermissions: this.folderMetadata.roleBasedPermissions
                    }
                }
            })
            .afterClosed()
            .subscribe((_) => {
                this.refresh.emit();
            });
    }

    deleteFolder() {
        this.dialog
            .open<ConfirmationModalComponent, ConfirmationModalData>(ConfirmationModalComponent, {
                data: { message: `Are you sure you want to delete '${this.folderMetadata.name}' and all its folders and documents?` }
            })
            .componentInstance.confirmEvent.subscribe(() => {
                this.httpClient.delete(`${this.urlService.apiUrl}/docs/folders/${this.folderMetadata.id}`).subscribe({
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
            });
    }

    addDocument() {
        this.dialog
            .open<CreateDocumentModalComponent, DocumentModalData>(CreateDocumentModalComponent, {
                data: {
                    folderMetadata: this.folderMetadata,
                    inheritedPermissions: this.folderMetadata.effectivePermissions
                }
            })
            .afterClosed()
            .subscribe((_) => {
                this.expandSelf();
                this.refresh.emit();
            });
    }

    get isEmpty(): boolean {
        return this.folderMetadata.documents.length === 0 && this.getFolderChildren.length === 0;
    }

    get getFolderChildren(): FolderMetadata[] {
        return this.allFolderMetadata.filter((x) => x.parent === this.folderMetadata.id);
    }

    get toggleState(): string {
        return this.expanded ? 'expanded' : 'collapsed';
    }
}
