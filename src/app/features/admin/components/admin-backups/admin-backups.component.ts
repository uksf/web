import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { BackupEntry, BackupEntryType, BackupRun, BackupRunState, BackupTreeNode } from '@app/features/admin/models/backup';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '@app/shared/components/content-areas/main-content-area/main-content-area.component';
import { BackupsService } from '../../services/backups.service';
import { BackupTreeComponent } from './backup-tree.component';

@Component({
    selector: 'app-admin-backups',
    templateUrl: './admin-backups.component.html',
    styleUrls: ['./admin-backups.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        MainContentAreaComponent,
        BackupTreeComponent,
        MatButton,
        MatIconButton,
        MatIcon,
        MatTooltip,
        MatCard,
        MatProgressSpinner,
        MatSlideToggle,
        DatePipe,
        DecimalPipe
    ]
})
export class AdminBackupsComponent implements OnInit {
    private backupsService = inject(BackupsService);
    private dialog = inject(MatDialog);

    entries: BackupEntry[] = [];
    runs: BackupRun[] = [];
    // Only the first load hides the page. Later loads keep the tree mounted so an expanded branch survives a change.
    loading = true;
    updating = false;
    running = false;
    error: string;

    readonly runState = BackupRunState;

    get selectedPaths(): string[] {
        return this.entries.map((entry) => entry.path);
    }

    get excludedPaths(): string[] {
        return this.entries.flatMap((entry) => entry.excludes);
    }

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.backupsService
            .getEntries()
            .pipe(first())
            .subscribe({
                next: (entries) => {
                    this.entries = entries;
                    this.loading = false;
                },
                error: () => {
                    this.error = 'Could not load the backup selection';
                    this.loading = false;
                }
            });

        this.loadRuns();
    }

    loadRuns(): void {
        this.backupsService
            .getRuns()
            .pipe(first())
            .subscribe({ next: (runs) => (this.runs = runs) });
    }

    include(node: BackupTreeNode): void {
        this.save(
            this.backupsService.addEntry({
                path: node.path,
                entryType: node.isDirectory ? BackupEntryType.Folder : BackupEntryType.File,
                recursive: true,
                excludes: [],
                enabled: true
            })
        );
    }

    exclude(node: BackupTreeNode): void {
        const parent = this.entries.find((entry) => this.contains(entry.path, node.path));
        if (!parent) {
            return;
        }

        this.save(this.backupsService.updateEntry({ ...parent, excludes: [...parent.excludes, node.path] }));
    }

    removeExclude(entry: BackupEntry, exclude: string): void {
        this.save(this.backupsService.updateEntry({ ...entry, excludes: entry.excludes.filter((x) => x !== exclude) }));
    }

    toggleEnabled(entry: BackupEntry, enabled: boolean): void {
        this.save(this.backupsService.updateEntry({ ...entry, enabled }));
    }

    toggleRecursive(entry: BackupEntry, recursive: boolean): void {
        this.save(this.backupsService.updateEntry({ ...entry, recursive }));
    }

    deleteEntry(entry: BackupEntry): void {
        this.dialog
            .open(ConfirmationModalComponent, { data: { message: `Stop backing up '${entry.path}'?` } })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.save(this.backupsService.deleteEntry(entry.id));
                    }
                }
            });
    }

    runNow(): void {
        this.dialog
            .open(ConfirmationModalComponent, { data: { message: 'Run a backup now? This dumps mongo, builds the archive and uploads it.' } })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (result) => {
                    if (!result) {
                        return;
                    }

                    this.running = true;
                    this.error = null;
                    this.backupsService
                        .runNow()
                        .pipe(first())
                        .subscribe({
                            next: () => {
                                this.running = false;
                                this.loadRuns();
                            },
                            error: (response) => {
                                this.running = false;
                                this.error = response?.error?.detail ?? 'Backup failed - check the logs';
                                this.loadRuns();
                            }
                        });
                }
            });
    }

    isFolder(entry: BackupEntry): boolean {
        return entry.entryType === BackupEntryType.Folder;
    }

    trackByEntry(_: number, entry: BackupEntry): string {
        return entry.id;
    }

    trackByRun(_: number, run: BackupRun): string {
        return run.id;
    }

    private save(request: Observable<unknown>): void {
        this.updating = true;
        this.error = null;
        request
            .pipe(first())
            .subscribe({
                next: () => {
                    this.updating = false;
                    this.load();
                },
                error: (response) => {
                    this.updating = false;
                    this.error = response?.error?.detail ?? 'That change was rejected';
                }
            });
    }

    private contains(parent: string, child: string): boolean {
        return child.toLowerCase().startsWith(`${parent.toLowerCase().replace(/\\+$/, '')}\\`);
    }
}
