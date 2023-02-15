import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DocumentMetadata, FolderMetadata } from '../../../Models/Documents';
import { MatDialog } from '@angular/material/dialog';
import { CreateFolderModalComponent } from '../../../Modals/docs/create-folder-modal/create-folder-modal.component';

@Component({
    selector: 'app-docs-sidebar',
    templateUrl: './docs-sidebar.component.html',
    styleUrls: ['./docs-sidebar.component.scss']
})
export class DocsSidebarComponent implements OnInit {
    @Input('allDocumentMetadata') allFolderMetadata: FolderMetadata[];
    @Output('refresh') refresh = new EventEmitter();

    constructor(private dialog: MatDialog) {}

    ngOnInit(): void {}

    addFolder() {
        this.dialog
            .open(CreateFolderModalComponent)
            .afterClosed()
            .subscribe((_) => {
                this.refresh.emit();
            });
    }

    get getRootFolders(): FolderMetadata[] {
        if (this.allFolderMetadata === []) {
            return [];
        }

        return this.allFolderMetadata.filter((x) => x.parent === '000000000000000000000000');
    }

    trackById(_: any, folderMetadata: FolderMetadata) {
        return folderMetadata.id;
    }
}
