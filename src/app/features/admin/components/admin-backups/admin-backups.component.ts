import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Observable, timer } from 'rxjs';
import { first, switchMap, takeUntil } from 'rxjs/operators';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCard } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { BackupEntry, BackupEntryType, BackupRule, BackupRun, BackupRunState, BackupTreeNode } from '@app/features/admin/models/backup';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '@app/shared/components/content-areas/main-content-area/main-content-area.component';
import { DestroyableComponent } from '@app/shared/components/destroyable/destroyable.component';
import { isRuleEmpty, toRules, withoutRule, withRule } from './backup-rules';
import { BackupsService } from '../../services/backups.service';
import { BackupTreeComponent } from './backup-tree.component';

const POLL_INTERVAL_MS = 5000;

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
export class AdminBackupsComponent extends DestroyableComponent implements OnInit {
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
                includePatterns: [],
                excludes: [],
                enabled: true
            })
        );
    }

    rules(entry: BackupEntry): BackupRule[] {
        return toRules(entry);
    }

    addRule(entry: BackupEntry, rule: string, input: HTMLInputElement): void {
        if (isRuleEmpty(rule)) {
            return;
        }

        input.value = '';
        this.save(this.backupsService.updateEntry(withRule(entry, rule)));
    }

    removeRule(entry: BackupEntry, rule: BackupRule): void {
        this.save(this.backupsService.updateEntry(withoutRule(entry, rule)));
    }

    exclude(node: BackupTreeNode): void {
        const parent = this.entries.find((entry) => this.contains(entry.path, node.path));
        if (!parent) {
            return;
        }

        this.save(this.backupsService.updateEntry({ ...parent, excludes: [...parent.excludes, node.path] }));
    }

    /** Drops this path and everything selected below it, so a branch can be cleared from one row. */
    deselect(node: BackupTreeNode): void {
        const affected = this.entries.filter((entry) => this.samePath(entry.path, node.path) || this.contains(node.path, entry.path));
        if (!affected.length) {
            return;
        }

        const message =
            affected.length === 1
                ? `Stop backing up '${affected[0].path}'?`
                : `Stop backing up ${affected.length} selections under '${node.path}'?`;

        this.dialog
            .open(ConfirmationModalComponent, { data: { message } })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (result) => {
                    if (result) {
                        this.save(forkJoin(affected.map((entry) => this.backupsService.deleteEntry(entry.id))));
                    }
                }
            });
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

    get activeRun(): BackupRun {
        return this.runs.find((run) => run.state === BackupRunState.Running);
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
                                this.loadRuns();
                                this.pollRun();
                            },
                            error: (response) => {
                                this.running = false;
                                this.error = response?.error?.detail ?? 'Backup could not be started - check the logs';
                                this.loadRuns();
                            }
                        });
                }
            });
    }

    /** The run happens on the server, so the page follows it through the history rather than holding a request open. */
    private pollRun(): void {
        timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS)
            .pipe(
                switchMap(() => this.backupsService.getRuns()),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (runs) => {
                    this.runs = runs;
                    if (!this.activeRun) {
                        this.running = false;
                        this.destroy$.next();
                    }
                },
                error: () => (this.running = false)
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

    private samePath(left: string, right: string): boolean {
        return left?.toLowerCase() === right?.toLowerCase();
    }
}
