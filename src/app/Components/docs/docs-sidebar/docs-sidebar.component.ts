import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FolderMetadata } from '../../../Models/Documents';
import { MatDialog } from '@angular/material/dialog';
import { CreateFolderModalComponent } from '../../../Modals/docs/create-folder-modal/create-folder-modal.component';
import { collapseAnimations } from '../../../Services/animations.service';

@Component({
    selector: 'app-docs-sidebar',
    templateUrl: './docs-sidebar.component.html',
    styleUrls: ['./docs-sidebar.component.scss'],
    animations: [collapseAnimations.buttonExpansion, collapseAnimations.indicatorRotate, collapseAnimations.collapsed]
})
export class DocsSidebarComponent implements OnInit {
    @Input('allDocumentMetadata') allFolderMetadata: FolderMetadata[];
    @Output('refresh') refresh = new EventEmitter();
    collapseHoverState: string = 'collapsed';
    collapsedState: string = 'expanded';

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
        if (this.allFolderMetadata.length === 0) {
            return [];
        }

        return this.allFolderMetadata.filter((x) => x.parent === '000000000000000000000000');
    }

    onMouseOver() {
        this.collapseHoverState = 'expanded';
    }

    onMouseLeave() {
        this.collapseHoverState = 'collapsed';
    }

    toggleCollapse() {
        this.collapsedState = this.collapsedState === 'collapsed' ? 'expanded' : 'collapsed';
    }

    trackById(_: any, folderMetadata: FolderMetadata) {
        return folderMetadata.id;
    }

    get tooltip(): string {
        return this.collapsedState === 'expanded' ? 'Hide sidebar' : 'Show sidebar';
    }
}
