import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute } from '@angular/router';
import { distinctUntilChanged, first, map, takeUntil } from 'rxjs/operators';
import { FolderMetadata } from '@app/features/docs/models/documents';
import { MatDialog } from '@angular/material/dialog';
import { CreateFolderModalComponent } from '../../modals/create-folder-modal/create-folder-modal.component';
import { MatIcon } from '@angular/material/icon';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatTooltip } from '@angular/material/tooltip';
import { DocsFolderComponent } from './docs-folder/docs-folder.component';
import { DestroyableComponent } from '@app/shared/components';

const OVERLAY_QUERY = '(max-width: 768px)';

@Component({
    selector: 'app-docs-sidebar',
    templateUrl: './docs-sidebar.component.html',
    styleUrls: ['./docs-sidebar.component.scss'],
    host: { '[class.overlay]': 'overlay' },
    imports: [MatIcon, FlexFillerComponent, MatTooltip, DocsFolderComponent]
})
export class DocsSidebarComponent extends DestroyableComponent implements OnInit {
    private dialog = inject(MatDialog);
    private breakpointObserver = inject(BreakpointObserver);
    private route = inject(ActivatedRoute);

    @Input('allDocumentMetadata') allFolderMetadata: FolderMetadata[];
    @Input() expandedFolderIds = new Set<string>();
    @Output() refresh = new EventEmitter();
    overlay = this.breakpointObserver.isMatched(OVERLAY_QUERY);
    collapsed = this.overlay;

    ngOnInit(): void {
        this.breakpointObserver
            .observe(OVERLAY_QUERY)
            .pipe(
                map((state) => state.matches),
                distinctUntilChanged(),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (overlay) => {
                    if (overlay !== this.overlay) {
                        this.overlay = overlay;
                        this.collapsed = overlay;
                    }
                }
            });

        // On narrow screens the sidebar covers the page, so get out of the way once a document is picked
        this.route.queryParams
            .pipe(
                map((params) => params['document']),
                distinctUntilChanged(),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (document) => {
                    if (document && this.overlay) {
                        this.collapsed = true;
                    }
                }
            });
    }

    @HostListener('document:keydown.escape')
    onEscape() {
        if (this.overlay && !this.collapsed) {
            this.collapsed = true;
        }
    }

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
