import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { first } from 'rxjs/operators';
import { FolderMetadata } from '@app/features/docs/models/documents';
import { MatDialog } from '@angular/material/dialog';
import { CreateFolderModalComponent } from '../../modals/create-folder-modal/create-folder-modal.component';
import { collapseAnimations } from '@app/shared/services/animations.service';
import { MatIcon } from '@angular/material/icon';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatTooltip } from '@angular/material/tooltip';
import { DocsFolderComponent } from './docs-folder/docs-folder.component';

@Component({
    selector: 'app-docs-sidebar',
    templateUrl: './docs-sidebar.component.html',
    styleUrls: ['./docs-sidebar.component.scss'],
    animations: [collapseAnimations.collapsed],
    imports: [MatIcon, FlexFillerComponent, MatTooltip, DocsFolderComponent]
})
export class DocsSidebarComponent {
    private dialog = inject(MatDialog);

    @Input('allDocumentMetadata') allFolderMetadata: FolderMetadata[];
    @Input() expandedFolderIds = new Set<string>();
    @Output() refresh = new EventEmitter();
    collapsed = false;

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

    toggleCollapse() {
        this.collapsed = !this.collapsed;
    }

    trackById(_: number, folderMetadata: FolderMetadata) {
        return folderMetadata.id;
    }

    get tooltip(): string {
        return this.collapsed ? 'Show sidebar' : 'Hide sidebar';
    }
}
