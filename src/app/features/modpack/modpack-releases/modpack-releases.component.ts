import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { first } from 'rxjs';
import { parseMarkdownSync } from '../markdown-utils';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Permissions } from '@app/core/services/permissions';
import { ActivatedRoute, Router } from '@angular/router';
import { ModpackReleaseService } from '../modpackRelease.service';
import { GameDataExportService } from '../services/game-data-export.service';
import { ModpackRelease } from '../models/modpack-release';
import { GameDataExport, GameDataFile } from '../models/game-data-export';
import { DefaultContentAreasComponent } from '../../../shared/components/content-areas/default-content-areas/default-content-areas.component';
import { FullContentAreaComponent } from '../../../shared/components/content-areas/full-content-area/full-content-area.component';
import { NgxPermissionsModule } from 'ngx-permissions';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { NgClass, DatePipe } from '@angular/common';
import { FlexFillerComponent } from '../../../shared/components/elements/flex-filler/flex-filler.component';
import { ButtonComponent } from '../../../shared/components/elements/button-pending/button.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-modpack-releases',
    templateUrl: './modpack-releases.component.html',
    styleUrls: ['../modpack-page/modpack-page.component.scss', './modpack-releases.component.scss'],
    imports: [
        DefaultContentAreasComponent,
        FullContentAreaComponent,
        NgxPermissionsModule,
        MatButton,
        MatIconButton,
        MatIcon,
        MatMenu,
        MatMenuItem,
        MatMenuTrigger,
        NgClass,
        FlexFillerComponent,
        MarkdownComponent,
        ButtonComponent,
        FormsModule,
        DatePipe
    ]
})
export class ModpackReleasesComponent implements OnInit, OnDestroy {
    private static readonly FILE_NAMES: Record<GameDataFile, (v: string) => string> = {
        'config': (v) => `config_${v}.cpp`,
        'cba-settings': (v) => `cba_settings_${v}.sqf`,
        'cba-settings-reference': (v) => `cba_settings_reference_${v}.json`
    };

    private permissionsService = inject(PermissionsService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private modpackReleaseService = inject(ModpackReleaseService);
    private gameDataExportService = inject(GameDataExportService);

    private dataExports = new Map<string, GameDataExport>();

    selectedReleaseVersion: string = '';
    selectIncomingRelease: boolean = false;
    editing: boolean = false;
    preview: boolean = false;
    releasing: boolean = false;
    savingChangelog: boolean = false;
    changelogEditing: string;
    changelogStaging: string;
    changelogMarkdown: string;
    publicReleases: ModpackRelease[] = [];
    selectedRelease: ModpackRelease | undefined;
    latestReleaseIsDraft: boolean = false;

    get releases() {
        return this.modpackReleaseService.releases;
    }

    updateCachedState() {
        this.publicReleases = this.releases.filter((x: ModpackRelease) => !x.isDraft || this.permissionsService.hasPermission(Permissions.TESTER));
        this.selectedRelease = this.releases.find((x: ModpackRelease) => x.version === this.selectedReleaseVersion);
        this.latestReleaseIsDraft = this.releases.length > 0 && this.releases[0].isDraft;
    }

    ngOnDestroy(): void {
        this.modpackReleaseService.disconnect();
    }

    ngOnInit() {
        this.modpackReleaseService.connect(
            () => {
                this.updateCachedState();
                if (this.releases.length > 0) {
                    this.checkRoute();
                } else {
                    this.selectRelease(undefined);
                }
            },
            (version: string) => {
                this.updateCachedState();
                if (this.selectIncomingRelease) {
                    this.selectIncomingRelease = false;
                    this.selectRelease(version);
                }
            }
        );

        if (this.permissionsService.hasPermission(Permissions.ADMIN)) {
            this.gameDataExportService
                .list()
                .pipe(first())
                .subscribe({
                    next: (records) => {
                        this.dataExports.clear();
                        for (const r of records) {
                            this.dataExports.set(r.modpackVersion, r);
                        }
                    }
                });
        }
    }

    hasDataExport(version: string): boolean {
        return this.dataExports.has(version);
    }

    getDataExport(version: string): GameDataExport | undefined {
        return this.dataExports.get(version);
    }

    download(version: string, file: GameDataFile) {
        this.gameDataExportService
            .download(version, file)
            .pipe(first())
            .subscribe({
                next: (blob) => {
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement('a');
                    anchor.href = url;
                    anchor.download = ModpackReleasesComponent.FILE_NAMES[file](version);
                    anchor.click();
                    URL.revokeObjectURL(url);
                }
            });
    }

    checkRoute() {
        const version: string = this.route.snapshot.queryParams['version'];
        const index: number = this.publicReleases.findIndex((x: ModpackRelease) => x.version === version);
        if (version && index !== -1) {
            this.selectRelease(version);
        } else {
            this.selectRelease(this.publicReleases[0].version);
        }
    }

    selectRelease(version: string) {
        this.editing = false;
        this.selectedReleaseVersion = version;
        this.updateCachedState();
        if (!this.selectedRelease) {
            this.changelogMarkdown = '';
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { version: null },
                queryParamsHandling: 'merge'
            });
        } else {
            this.changelogMarkdown = parseMarkdownSync(this.selectedRelease.changelog);
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { version: this.selectedReleaseVersion },
                queryParamsHandling: 'merge'
            });
        }
    }

    newRelease() {
        this.modpackReleaseService.newRelease(() => {
            this.selectIncomingRelease = true;
        });
    }

    release() {
        this.releasing = true;
        this.modpackReleaseService.release(this.selectedRelease.version, () => {
            this.router.navigate(['/modpack/builds-rc'], {
                queryParams: {
                    version: this.selectedRelease.version,
                    log: true
                }
            });
            this.releasing = false;
        });
    }

    regenerateChangelog() {
        this.savingChangelog = true;
        this.modpackReleaseService.regenerateChangelog(this.selectedReleaseVersion, (changelog: string) => {
            this.changelogMarkdown = parseMarkdownSync(changelog);
            this.savingChangelog = false;
        });
    }

    edit() {
        this.editing = true;
        this.changelogStaging = this.selectedRelease.changelog;
        this.formatChangelog(this.editing);
    }

    togglePreview() {
        this.preview = !this.preview;
        if (this.preview) {
            this.formatChangelog(false);
            this.changelogMarkdown = parseMarkdownSync(this.changelogStaging);
        }
    }

    save() {
        this.editing = false;
        this.preview = false;
        this.savingChangelog = true;
        this.formatChangelog(this.editing);
        this.selectedRelease.changelog = this.changelogStaging;
        this.modpackReleaseService.saveReleaseChanges(this.selectedRelease, () => {
            this.changelogMarkdown = parseMarkdownSync(this.selectedRelease.changelog);
            this.savingChangelog = false;
        });
    }

    discard() {
        this.editing = false;
        this.preview = false;
        this.changelogEditing = '';
        this.changelogStaging = '';
        this.changelogMarkdown = parseMarkdownSync(this.selectedRelease.changelog);
    }

    formatChangelog(editing: boolean) {
        if (editing) {
            this.changelogEditing = this.changelogStaging.replace(/<br>/g, '');
        } else {
            const lines: string[] = this.changelogEditing.split('\n');
            for (let index = 0; index < lines.length; index++) {
                const line: string = lines[index];
                if (line.startsWith('  ') && !line.match(/( {2,})-/)) {
                    lines[index] = `<br>${line}`;
                }
            }
            this.changelogStaging = lines.join('\n');
        }
    }
}
