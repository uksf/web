import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FolderMetadata } from '@app/features/docs/models/documents';
import { MatDialog } from '@angular/material/dialog';
import { CreateFolderModalComponent } from '../../modals/create-folder-modal/create-folder-modal.component';
import { collapseAnimations } from '@app/shared/services/animations.service';

@Component({
    selector: 'app-docs-sidebar',
    templateUrl: './docs-sidebar.component.html',
    styleUrls: ['./docs-sidebar.component.scss'],
    animations: [collapseAnimations.buttonExpansion, collapseAnimations.indicatorRotate, collapseAnimations.collapsed]
})
export class DocsSidebarComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    @Input('allDocumentMetadata') allFolderMetadata: FolderMetadata[];
    @Output('refresh') refresh = new EventEmitter();
    collapseHoverState: string = 'collapsed';
    collapsedState: string = 'expanded';

    constructor(private dialog: MatDialog) {}

    ngOnInit(): void {}

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    addFolder() {
        this.dialog
            .open(CreateFolderModalComponent, {
                data: {
                    parent: '000000000000000000000000'
                }
            })
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
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

    trackById(_: any, folderMetadata: FolderMetadata) {
        return folderMetadata.id;
    }

    get tooltip(): string {
        return this.collapsedState === 'expanded' ? 'Hide sidebar' : 'Show sidebar';
    }
}
