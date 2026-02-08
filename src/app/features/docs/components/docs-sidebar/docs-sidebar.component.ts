import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { first } from 'rxjs/operators';
import { FolderMetadata } from '@app/features/docs/models/documents';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { CreateFolderModalComponent } from '../../modals/create-folder-modal/create-folder-modal.component';
import { collapseAnimations } from '@app/shared/services/animations.service';

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
            .open(CreateFolderModalComponent, {
                data: {
                    parent: '000000000000000000000000'
                }
            })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (_) => {
                    this.refresh.emit();
                }
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

    trackById(_: number, folderMetadata: FolderMetadata) {
        return folderMetadata.id;
    }

    get tooltip(): string {
        return this.collapsedState === 'expanded' ? 'Hide sidebar' : 'Show sidebar';
    }
}
