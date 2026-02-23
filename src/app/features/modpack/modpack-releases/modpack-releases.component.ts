import { Component, OnDestroy, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { parseMarkdownSync } from '../markdown-utils';
import { PermissionsService } from '@app/core/services/permissions.service';
import { Permissions } from '@app/core/services/permissions';
import { ActivatedRoute, Router } from '@angular/router';
import { ModpackReleaseService } from '../modpackRelease.service';
import { ModpackRelease } from '../models/modpack-release';

@Component({
    selector: 'app-modpack-releases',
    templateUrl: './modpack-releases.component.html',
    styleUrls: ['../modpack-page/modpack-page.component.scss', './modpack-releases.component.scss', './modpack-releases.component.scss-theme.scss'],
    standalone: false
})
export class ModpackReleasesComponent implements OnInit, OnDestroy {
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
    private originalLinkRenderer: typeof this.markdownService.renderer.link;

    constructor(
        private markdownService: MarkdownService,
        private permissionsService: PermissionsService,
        private route: ActivatedRoute,
        private router: Router,
        private modpackReleaseService: ModpackReleaseService
    ) {}

    get releases() {
        return this.modpackReleaseService.releases;
    }

    updateCachedState() {
        this.publicReleases = this.releases.filter((x: ModpackRelease) => !x.isDraft || this.permissionsService.hasPermission(Permissions.TESTER));
        this.selectedRelease = this.releases.find((x: ModpackRelease) => x.version === this.selectedReleaseVersion);
        this.latestReleaseIsDraft = this.releases.length > 0 && this.releases[0].isDraft;
    }

    ngOnDestroy(): void {
        this.markdownService.renderer.link = this.originalLinkRenderer;
        this.modpackReleaseService.disconnect();
    }

    ngOnInit() {
        this.originalLinkRenderer = this.markdownService.renderer.link;
        const linkRenderer = this.markdownService.renderer.link;
        this.markdownService.renderer.link = (args: { href: string; title?: string | null | undefined; tokens: unknown[] }) => {
            const html: string = linkRenderer.call(this.markdownService.renderer, args);
            return html.replace(/^<a /, '<a target="_blank" rel="nofollow" ');
        };

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
            this.changelogMarkdown = parseMarkdownSync(this.markdownService, this.selectedRelease.changelog);
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
            this.changelogMarkdown = parseMarkdownSync(this.markdownService, changelog);
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
            this.changelogMarkdown = parseMarkdownSync(this.markdownService, this.changelogStaging);
        }
    }

    save() {
        this.editing = false;
        this.preview = false;
        this.savingChangelog = true;
        this.formatChangelog(this.editing);
        this.selectedRelease.changelog = this.changelogStaging;
        this.modpackReleaseService.saveReleaseChanges(this.selectedRelease, () => {
            this.changelogMarkdown = parseMarkdownSync(this.markdownService, this.selectedRelease.changelog);
            this.savingChangelog = false;
        });
    }

    discard() {
        this.editing = false;
        this.preview = false;
        this.changelogEditing = '';
        this.changelogStaging = '';
        this.changelogMarkdown = parseMarkdownSync(this.markdownService, this.selectedRelease.changelog);
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
