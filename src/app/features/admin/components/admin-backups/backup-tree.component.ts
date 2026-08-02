import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { first } from 'rxjs/operators';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { BackupTreeNode } from '@app/features/admin/models/backup';
import { BackupsService } from '../../services/backups.service';

interface BackupTreeRow {
    node: BackupTreeNode;
    level: number;
    expanded: boolean;
    loading: boolean;
}

@Component({
    selector: 'app-backup-tree',
    templateUrl: './backup-tree.component.html',
    styleUrls: ['./backup-tree.component.scss'],
    imports: [MatIcon, MatIconButton, MatTooltip, MatProgressSpinner]
})
export class BackupTreeComponent implements OnInit {
    private backupsService = inject(BackupsService);

    @Input() selectedPaths: string[] = [];
    @Input() excludedPaths: string[] = [];
    @Output() include = new EventEmitter<BackupTreeNode>();
    @Output() exclude = new EventEmitter<BackupTreeNode>();
    @Output() deselect = new EventEmitter<BackupTreeNode>();

    rows: BackupTreeRow[] = [];
    loading = true;
    error: string;

    ngOnInit(): void {
        this.backupsService
            .getTree()
            .pipe(first())
            .subscribe({
                next: (nodes) => {
                    this.rows = nodes.map((node) => this.toRow(node, 0));
                    this.loading = false;
                },
                error: () => {
                    this.error = 'Could not read drives';
                    this.loading = false;
                }
            });
    }

    toggle(row: BackupTreeRow): void {
        if (!row.node.isDirectory || !row.node.hasChildren) {
            return;
        }

        if (row.expanded) {
            this.collapse(row);
            return;
        }

        row.loading = true;
        this.backupsService
            .getTree(row.node.path)
            .pipe(first())
            .subscribe({
                next: (nodes) => {
                    const index = this.rows.indexOf(row);
                    this.rows.splice(index + 1, 0, ...nodes.map((node) => this.toRow(node, row.level + 1)));
                    row.expanded = true;
                    row.loading = false;
                },
                error: () => {
                    row.loading = false;
                }
            });
    }

    isSelected(row: BackupTreeRow): boolean {
        return this.selectedPaths.some((path) => this.samePath(path, row.node.path));
    }

    isExcluded(row: BackupTreeRow): boolean {
        return this.excludedPaths.some((path) => this.samePath(path, row.node.path));
    }

    /** A node inside a selected folder can be excluded, but cannot be selected again. */
    isCovered(row: BackupTreeRow): boolean {
        return this.selectedPaths.some((path) => this.contains(path, row.node.path));
    }

    /** Something below this folder is selected, so the branch is worth opening. */
    hasSelectionBelow(row: BackupTreeRow): boolean {
        return row.node.isDirectory && this.selectedPaths.some((path) => this.contains(row.node.path, path));
    }

    /** This row, or anything under it, can be dropped from the backup here. */
    canDeselect(row: BackupTreeRow): boolean {
        return this.isSelected(row) || this.hasSelectionBelow(row);
    }

    trackByPath(_: number, row: BackupTreeRow): string {
        return row.node.path;
    }

    private collapse(row: BackupTreeRow): void {
        const index = this.rows.indexOf(row);
        let end = index + 1;
        while (end < this.rows.length && this.rows[end].level > row.level) {
            end++;
        }
        this.rows.splice(index + 1, end - index - 1);
        row.expanded = false;
    }

    private toRow(node: BackupTreeNode, level: number): BackupTreeRow {
        return { node, level, expanded: false, loading: false };
    }

    private samePath(left: string, right: string): boolean {
        return left?.toLowerCase() === right?.toLowerCase();
    }

    private contains(parent: string, child: string): boolean {
        const normalisedParent = parent.toLowerCase().replace(/\\+$/, '');
        const normalisedChild = child.toLowerCase();
        return normalisedChild.startsWith(normalisedParent + '\\');
    }
}
